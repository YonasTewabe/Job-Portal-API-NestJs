import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Message } from './entities/message.entity';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Application } from '../application/entities/application.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../users/entities/user.entity';

interface AuthUser {
  id: string;
  role: string;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ConversationParticipant)
    private readonly participantRepo: Repository<ConversationParticipant>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findConversations(user: AuthUser) {
    const conversationRelations = [
      'application',
      'application.applicant',
      'application.applicant.user',
      'application.job',
      'application.job.company',
      'company',
      'company.admin',
      'contactUser',
      'participants',
      'participants.user',
    ];

    const seenIds = new Set<string>();
    const results: ReturnType<ChatService['formatConversation']>[] = [];

    const appendConversation = async (conv: Conversation) => {
      if (!conv?.id || seenIds.has(conv.id)) return;
      seenIds.add(conv.id);

      const participant = await this.participantRepo.findOne({
        where: {
          conversation: { id: conv.id },
          user: { id: user.id },
        },
      });

      const [lastMessage] = await this.messageRepo.find({
        where: { conversation: { id: conv.id } },
        relations: ['sender'],
        order: { createdAt: 'DESC' },
        take: 1,
      });

      const unreadCount = participant
        ? await this.countUnread(conv.id, user.id, participant.lastReadAt)
        : 0;

      results.push(
        this.formatConversation(conv, user, lastMessage ?? null, unreadCount),
      );
    };

    if (user.role === 'superadmin') {
      const adminConversationTypes = ['company_support', 'platform_contact'] as const;
      for (const type of adminConversationTypes) {
        const adminConversations = await this.conversationRepo.find({
          where: { type },
          relations: conversationRelations,
          order: { lastMessageAt: 'DESC' },
        });

        for (const conv of adminConversations) {
          const synced = await this.syncAllSuperadminParticipants(conv);
          await appendConversation(synced);
        }
      }
    }

    const participants = await this.participantRepo.find({
      where: { user: { id: user.id } },
      relations: [
        'conversation',
        ...conversationRelations.map((r) => `conversation.${r}`),
      ],
    });

    for (const p of participants) {
      if (p.conversation) {
        await appendConversation(p.conversation);
      }
    }

    return results.sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  async getOrCreateConversation(dto: CreateConversationDto, user: AuthUser) {
    if (dto.type === 'job_application') {
      return this.getOrCreateJobConversation(dto.applicationId!, user);
    }
    if (dto.type === 'company_support') {
      return this.getOrCreateSupportConversation(dto.companyId, user);
    }
    throw new BadRequestException('Invalid conversation type');
  }

  /** One-way contact form inquiry visible to super admins (not replyable). */
  async createContactInquiry(
    dto: CreateContactInquiryDto,
    user: AuthUser | null,
  ) {
    const superadmins = await this.userRepo.find({
      where: { role: 'superadmin' },
    });

    const subject = dto.subject.trim();
    const message = dto.message.trim();

    let submitter: User | null = null;
    let senderName: string;
    let senderEmail: string;

    if (user) {
      submitter = await this.userRepo.findOneBy({ id: user.id });
      if (!submitter) throw new NotFoundException('User not found');
      senderName = submitter.name;
      senderEmail = submitter.email;
    } else {
      senderName = dto.name?.trim() ?? '';
      senderEmail = dto.email?.trim() ?? '';
      if (!senderName || !senderEmail) {
        throw new BadRequestException('Name and email are required');
      }
    }

    let conversation = this.conversationRepo.create({
      type: 'platform_contact',
      application: null,
      company: null,
      contactUser: submitter,
      contactName: senderName,
      contactEmail: senderEmail,
      subject,
      replyable: false,
      lastMessageAt: null,
    });
    conversation = await this.conversationRepo.save(conversation);

    const participantRows: ConversationParticipant[] = [];

    if (submitter) {
      participantRows.push(
        this.participantRepo.create({
          conversation,
          user: submitter,
          lastReadAt: null,
        }),
      );
    }

    for (const sa of superadmins) {
      participantRows.push(
        this.participantRepo.create({
          conversation,
          user: sa,
          lastReadAt: null,
        }),
      );
    }

    await this.participantRepo.save(participantRows);

    const content = `From: ${senderName} (${senderEmail})\nSubject: ${subject}\n\n${message}`;
    await this.insertConversationMessage(
      conversation,
      submitter?.id ?? null,
      content,
    );

    if (!user) {
      return { success: true };
    }

    const loaded = await this.conversationRepo.findOne({
      where: { id: conversation.id },
      relations: ['contactUser', 'participants', 'participants.user'],
    });
    if (!loaded) {
      throw new NotFoundException('Failed to create contact inquiry');
    }

    const [lastMessage] = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return this.formatConversation(loaded, user, lastMessage ?? null, 0);
  }

  /** Returns existing job-application conversation or null (does not create). */
  async findJobConversationByApplication(
    applicationId: string,
    user: AuthUser,
  ) {
    await this.assertCanAccessJobApplicationChat(applicationId, user);

    const conversation = await this.findJobConversationEntity(applicationId);
    if (!conversation) return null;

    const participant = await this.participantRepo.findOne({
      where: {
        conversation: { id: conversation.id },
        user: { id: user.id },
      },
    });

    const [lastMessage] = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return this.formatConversation(
      conversation,
      user,
      lastMessage ?? null,
      participant
        ? await this.countUnread(conversation.id, user.id, participant.lastReadAt)
        : 0,
    );
  }

  /**
   * Creates the conversation if needed and posts a message from the company admin.
   * Used when application status changes (accept, reject, interview, reschedule).
   */
  async sendApplicationStatusMessage(params: {
    applicationId: string;
    senderUserId: string;
    content: string;
  }): Promise<void> {
    const conversation = await this.ensureJobConversation(params.applicationId);
    await this.insertConversationMessage(
      conversation,
      params.senderUserId,
      params.content,
    );
  }

  /** Returns existing company-support conversation or null (does not create). */
  async findSupportConversation(
    companyId: string | undefined,
    user: AuthUser,
  ) {
    const company = await this.resolveSupportCompany(companyId, user);
    let conversation = await this.findSupportConversationEntity(company.id);
    if (!conversation) return null;

    if (user.role === 'superadmin') {
      conversation = await this.syncAllSuperadminParticipants(conversation);
      conversation = await this.ensureSuperadminParticipant(conversation, user.id);
    }

    const participant = await this.participantRepo.findOne({
      where: {
        conversation: { id: conversation.id },
        user: { id: user.id },
      },
    });

    const [lastMessage] = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 1,
    });

    return this.formatConversation(
      conversation,
      user,
      lastMessage ?? null,
      participant
        ? await this.countUnread(conversation.id, user.id, participant.lastReadAt)
        : 0,
    );
  }

  async getMessages(conversationId: string, user: AuthUser) {
    await this.resolveParticipant(conversationId, user);

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['contactUser'],
    });

    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      take: 200,
    });

    const fallbackSenderName =
      conversation?.contactUser?.name ??
      conversation?.contactName ??
      'Guest';

    return messages.map((m) => {
      const senderId = m.sender?.id ?? null;
      return {
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        sender: {
          id: senderId,
          name: m.sender?.name ?? fallbackSenderName,
          role: m.sender?.role ?? 'guest',
        },
        isMine: senderId ? senderId === user.id : false,
      };
    });
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, user: AuthUser) {
    const participant = await this.resolveParticipant(conversationId, user);

    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: [
        'application',
        'application.applicant',
        'application.applicant.user',
        'application.job',
        'application.job.company',
        'company',
        'company.admin',
        'contactUser',
        'participants',
        'participants.user',
      ],
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    if (conversation.replyable === false) {
      throw new ForbiddenException('This conversation does not accept replies');
    }

    const message = this.messageRepo.create({
      conversation,
      sender: { id: user.id } as User,
      content: dto.content.trim(),
    });
    const saved = await this.messageRepo.save(message);
    const sender = await this.userRepo.findOneBy({ id: user.id });
    if (sender) saved.sender = sender;

    conversation.lastMessageAt = saved.createdAt;
    await this.conversationRepo.save(conversation);

    participant.lastReadAt = saved.createdAt;
    await this.participantRepo.save(participant);

    return {
      id: saved.id,
      content: saved.content,
      createdAt: saved.createdAt,
      sender: {
        id: user.id,
        name: sender?.name ?? '',
        role: user.role,
      },
      isMine: true,
      conversation: this.formatConversation(conversation, user, saved, 0),
    };
  }

  async markAsRead(conversationId: string, user: AuthUser) {
    const participant = await this.resolveParticipant(conversationId, user);
    participant.lastReadAt = new Date();
    await this.participantRepo.save(participant);
    return { success: true };
  }

  async getUnreadTotal(userId: string): Promise<number> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (user?.role === 'superadmin') {
      const adminConversationTypes = ['company_support', 'platform_contact'] as const;
      for (const type of adminConversationTypes) {
        const adminConversations = await this.conversationRepo.find({
          where: { type },
          relations: ['company', 'contactUser', 'participants', 'participants.user'],
        });
        for (const conv of adminConversations) {
          await this.syncAllSuperadminParticipants(conv);
        }
      }
    }

    const participants = await this.participantRepo.find({
      where: { user: { id: userId } },
      relations: ['conversation'],
    });

    let total = 0;
    for (const p of participants) {
      if (!p.conversation) continue;
      total += await this.countUnread(p.conversation.id, userId, p.lastReadAt);
    }
    return total;
  }

  private async getOrCreateJobConversation(applicationId: string, user: AuthUser) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required');
    }

    await this.assertCanAccessJobApplicationChat(applicationId, user);
    const conversation = await this.ensureJobConversation(applicationId);
    return this.formatConversation(conversation, user, null, 0);
  }

  private async assertCanAccessJobApplicationChat(
    applicationId: string,
    user: AuthUser,
  ): Promise<void> {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['applicant', 'applicant.user', 'job', 'job.company', 'job.company.admin'],
    });
    if (!application) throw new NotFoundException('Application not found');

    const applicantUserId = application.applicant?.user?.id;
    const adminUserId = application.job?.company?.admin?.id;

    const isApplicant = user.role === 'user' && applicantUserId === user.id;
    const isCompanyAdmin =
      user.role === 'company_admin' && adminUserId === user.id;
    const isSuperadmin = user.role === 'superadmin';

    if (!isApplicant && !isCompanyAdmin && !isSuperadmin) {
      throw new ForbiddenException('You cannot access this conversation');
    }
  }

  private async findJobConversationEntity(applicationId: string) {
    return this.conversationRepo.findOne({
      where: {
        type: 'job_application',
        application: { id: applicationId },
      },
      relations: [
        'application',
        'application.applicant',
        'application.applicant.user',
        'application.job',
        'application.job.company',
        'participants',
        'participants.user',
      ],
    });
  }

  private async ensureJobConversation(applicationId: string): Promise<Conversation> {
    const existing = await this.findJobConversationEntity(applicationId);
    if (existing) return existing;

    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: [
        'applicant',
        'applicant.user',
        'job',
        'job.company',
        'job.company.admin',
      ],
    });
    if (!application) throw new NotFoundException('Application not found');

    const applicantUserId = application.applicant?.user?.id;
    const adminUserId = application.job?.company?.admin?.id;

    if (!applicantUserId || !adminUserId) {
      throw new BadRequestException(
        'Application is missing required participants',
      );
    }

    let conversation = this.conversationRepo.create({
      type: 'job_application',
      application,
      company: null,
      lastMessageAt: null,
    });
    conversation = await this.conversationRepo.save(conversation);

    await this.participantRepo.save([
      this.participantRepo.create({
        conversation,
        user: { id: applicantUserId } as User,
        lastReadAt: null,
      }),
      this.participantRepo.create({
        conversation,
        user: { id: adminUserId } as User,
        lastReadAt: null,
      }),
    ]);

    const loaded = await this.findJobConversationEntity(applicationId);
    if (!loaded) {
      throw new NotFoundException('Failed to create conversation');
    }
    return loaded;
  }

  private async insertConversationMessage(
    conversation: Conversation,
    senderUserId: string | null,
    content: string,
  ): Promise<Message> {
    const message = this.messageRepo.create({
      conversation,
      sender: senderUserId ? ({ id: senderUserId } as User) : null,
      content: content.trim(),
    });
    const saved = await this.messageRepo.save(message);

    conversation.lastMessageAt = saved.createdAt;
    await this.conversationRepo.save(conversation);

    if (senderUserId) {
      const senderParticipant = await this.participantRepo.findOne({
        where: {
          conversation: { id: conversation.id },
          user: { id: senderUserId },
        },
      });
      if (senderParticipant) {
        senderParticipant.lastReadAt = saved.createdAt;
        await this.participantRepo.save(senderParticipant);
      }
    }

    return saved;
  }

  private async getOrCreateSupportConversation(
    companyId: string | undefined,
    user: AuthUser,
  ) {
    const company = await this.resolveSupportCompany(companyId, user);
    let conversation = await this.ensureSupportConversation(company.id);

    if (user.role === 'superadmin') {
      conversation = await this.ensureSuperadminParticipant(
        conversation,
        user.id,
      );
    }

    return this.formatConversation(conversation, user, null, 0);
  }

  private async resolveSupportCompany(
    companyId: string | undefined,
    user: AuthUser,
  ): Promise<Company> {
    if (user.role === 'company_admin') {
      const company = await this.companyRepo.findOne({
        where: { admin: { id: user.id } },
        relations: ['admin'],
      });
      if (!company) {
        throw new NotFoundException('Company not found for this admin');
      }
      return company;
    }

    if (user.role === 'superadmin') {
      if (!companyId) {
        throw new BadRequestException('companyId is required for superadmin');
      }
      const company = await this.companyRepo.findOne({
        where: { id: companyId },
        relations: ['admin'],
      });
      if (!company) throw new NotFoundException('Company not found');
      return company;
    }

    throw new ForbiddenException(
      'Only company admins and superadmins can use support chat',
    );
  }

  private async findSupportConversationEntity(companyId: string) {
    return this.conversationRepo.findOne({
      where: {
        type: 'company_support',
        company: { id: companyId },
      },
      relations: [
        'company',
        'company.admin',
        'participants',
        'participants.user',
      ],
    });
  }

  private async ensureSupportConversation(companyId: string): Promise<Conversation> {
    const existing = await this.findSupportConversationEntity(companyId);
    if (existing) return this.syncAllSuperadminParticipants(existing);

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      relations: ['admin'],
    });
    if (!company) throw new NotFoundException('Company not found');

    const superadmins = await this.userRepo.find({
      where: { role: 'superadmin' },
    });

    let conversation = this.conversationRepo.create({
      type: 'company_support',
      application: null,
      company,
      lastMessageAt: null,
    });
    conversation = await this.conversationRepo.save(conversation);

    const participantRows: ConversationParticipant[] = [
      this.participantRepo.create({
        conversation,
        user: { id: company.admin.id } as User,
        lastReadAt: null,
      }),
    ];

    for (const sa of superadmins) {
      participantRows.push(
        this.participantRepo.create({
          conversation,
          user: sa,
          lastReadAt: null,
        }),
      );
    }

    await this.participantRepo.save(participantRows);

    const loaded = await this.findSupportConversationEntity(companyId);
    if (!loaded) {
      throw new NotFoundException('Failed to create support conversation');
    }
    return loaded;
  }

  private async syncAllSuperadminParticipants(
    conversation: Conversation,
  ): Promise<Conversation> {
    const superadmins = await this.userRepo.find({
      where: { role: 'superadmin' },
    });

    let current = conversation;
    for (const sa of superadmins) {
      current = await this.ensureSuperadminParticipant(current, sa.id);
    }
    return current;
  }

  private async ensureSuperadminParticipant(
    conversation: Conversation,
    superadminUserId: string,
  ): Promise<Conversation> {
    const alreadyParticipant = (conversation.participants ?? []).some(
      (p) => p.user?.id === superadminUserId,
    );
    if (alreadyParticipant) return conversation;

    await this.participantRepo.save(
      this.participantRepo.create({
        conversation,
        user: { id: superadminUserId } as User,
        lastReadAt: null,
      }),
    );

    if (conversation.type === 'company_support' && conversation.company?.id) {
      const reloaded = await this.findSupportConversationEntity(
        conversation.company.id,
      );
      return reloaded ?? conversation;
    }

    const reloaded = await this.conversationRepo.findOne({
      where: { id: conversation.id },
      relations: [
        'company',
        'company.admin',
        'contactUser',
        'participants',
        'participants.user',
      ],
    });
    return reloaded ?? conversation;
  }

  private async resolveParticipant(conversationId: string, user: AuthUser) {
    let participant = await this.participantRepo.findOne({
      where: {
        conversation: { id: conversationId },
        user: { id: user.id },
      },
      relations: ['conversation', 'user'],
    });
    if (participant) return participant;

    if (user.role === 'superadmin') {
      const conversation = await this.conversationRepo.findOne({
        where: { id: conversationId },
        relations: [
          'company',
          'contactUser',
          'participants',
          'participants.user',
        ],
      });
      if (
        conversation &&
        (conversation.type === 'company_support' ||
          conversation.type === 'platform_contact')
      ) {
        const synced = await this.ensureSuperadminParticipant(
          conversation,
          user.id,
        );
        participant = await this.participantRepo.findOne({
          where: {
            conversation: { id: synced.id },
            user: { id: user.id },
          },
          relations: ['conversation', 'user'],
        });
        if (participant) return participant;
      }
    }

    throw new ForbiddenException(
      'You are not a participant in this conversation',
    );
  }

  private async countUnread(
    conversationId: string,
    userId: string,
    lastReadAt: Date | null,
  ): Promise<number> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversation_id = :conversationId', { conversationId })
      .andWhere('(m.sender_id IS NULL OR m.sender_id != :userId)', { userId });

    if (lastReadAt) {
      qb.andWhere('m.createdAt > :lastReadAt', { lastReadAt });
    }

    return qb.getCount();
  }

  private formatConversation(
    conv: Conversation,
    user: AuthUser,
    lastMessage: Message | null,
    unreadCount: number,
  ) {
    const otherParticipants = (conv.participants ?? [])
      .map((p) => p.user)
      .filter((u) => u?.id && u.id !== user.id);

    let title = '';
    let subtitle = '';

    if (conv.type === 'job_application') {
      const job = conv.application?.job;
      const applicant = conv.application?.applicant?.user;
      title = job?.title ?? 'Job application';
      if (user.role === 'user') {
        subtitle = job?.company?.name ?? 'Company';
      } else {
        subtitle = applicant?.name ?? 'Applicant';
      }
    } else if (conv.type === 'platform_contact') {
      if (user.role === 'superadmin') {
        title = conv.contactUser?.name ?? conv.contactName ?? 'Guest inquiry';
        subtitle = conv.subject ?? 'Contact form';
      } else {
        title = 'Platform support';
        subtitle = conv.subject ?? 'Contact inquiry';
      }
    } else if (user.role === 'superadmin') {
      title = conv.company?.name ?? 'Company';
      subtitle = conv.company?.admin?.name ?? 'Company admin';
    } else {
      title = 'Platform support';
      subtitle = 'Support';
    }

    const sender = lastMessage?.sender;
    const senderIsObject = sender && typeof sender === 'object';
    const lastSenderName = senderIsObject
      ? (sender.name ?? '')
      : conv.type === 'platform_contact'
        ? (conv.contactUser?.name ?? conv.contactName ?? 'Guest')
        : '';

    return {
      id: conv.id,
      type: conv.type,
      title,
      subtitle,
      replyable: conv.replyable !== false,
      applicationId: conv.application?.id ?? null,
      jobId: conv.application?.job?.id ?? null,
      companyId: conv.company?.id ?? null,
      participants: otherParticipants.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      })),
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderName: lastSenderName,
            isMine: senderIsObject ? sender.id === user.id : false,
          }
        : null,
      lastMessageAt: conv.lastMessageAt,
      unreadCount,
    };
  }
}
