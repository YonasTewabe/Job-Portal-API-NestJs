import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  findConversations(@CurrentUser() user: { id: string; role: string }) {
    return this.chatService.findConversations(user);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: { id: string }) {
    return this.chatService.getUnreadTotal(user.id);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  getOrCreate(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.getOrCreateConversation(dto, user);
  }

  @Get('conversations/by-application/:applicationId')
  findByApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.findJobConversationByApplication(
      applicationId,
      user,
    );
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('contact-inquiries')
  @HttpCode(HttpStatus.CREATED)
  createContactInquiry(
    @Body() dto: CreateContactInquiryDto,
    @CurrentUser() user?: { id: string; role: string },
  ) {
    return this.chatService.createContactInquiry(dto, user ?? null);
  }

  @Get('conversations/company-support')
  findCompanySupport(
    @Query('companyId') companyId: string | undefined,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.findSupportConversation(companyId, user);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.getMessages(id, user);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.sendMessage(id, dto, user);
  }

  @Patch('conversations/:id/read')
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.chatService.markAsRead(id, user);
  }
}
