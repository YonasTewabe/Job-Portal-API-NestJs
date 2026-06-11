import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class ChapaService {
  constructor(private readonly cfg: AppConfigService) {}

  async initiate(encryptedData: string) {
    if (!encryptedData) {
      throw new BadRequestException('Encrypted data missing');
    }

    const encryptionKey = this.cfg.chapaEncryptionKey;
    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'Encryption key is missing in backend',
      );
    }

    const secretKey = this.cfg.chapaSecretKey;
    if (!secretKey) {
      throw new InternalServerErrorException('Chapa secret key is missing');
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const decryptedPayload = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    const {
      amount,
      email,
      first_name,
      last_name,
      phone,
      tx_ref,
      callback_url,
    } = decryptedPayload;

    try {
      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          amount,
          email,
          first_name,
          last_name,
          phone_number: phone,
          tx_ref,
          currency: 'ETB',
          callback_url,
          return_url: callback_url,
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return chapaResponse.data;
    } catch (error: any) {
      const errorMessage =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message ||
            error.message ||
            'Failed to initialize payment';

      throw new InternalServerErrorException(errorMessage);
    }
  }

  async verify(txRef: string) {
    if (!txRef) {
      throw new BadRequestException('Transaction reference is missing');
    }

    const secretKey = this.cfg.chapaSecretKey;
    if (!secretKey) {
      throw new InternalServerErrorException('Chapa secret key is missing');
    }

    try {
      const response = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      if (response.data.status === 'success') {
        return { status: 'success', message: 'Payment Successful!' };
      }

      throw new BadRequestException({
        status: 'failed',
        message: 'Payment failed or status unknown',
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;

      const errorMessage =
        typeof error.response?.data === 'string'
          ? error.response.data
          : error.response?.data?.message ||
            error.message ||
            'Error verifying payment status';

      throw new InternalServerErrorException(errorMessage);
    }
  }
}
