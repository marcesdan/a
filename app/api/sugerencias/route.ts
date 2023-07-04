import { NextResponse } from 'next/server';

import { config as dotenvConfig } from 'dotenv';
import { sendEmail } from './mail';
import { saveDynamoDB } from './dynamo';
import { recaptchaValidator } from './recaptcha';
import { BodyObject } from '@/app/types';
import { Config } from 'aws-sdk';

dotenvConfig();

export async function POST(request: Request) {
   try {
      const body: BodyObject = await request.json();
      if (!body.name || !body.email || !body.message) {
         throw new Error('Todos los campos son requeridos');
      }
      // Validacion ReCaptcha
      await recaptchaValidator(body.recaptchaToken);
      const config = new Config();
      config.update({
         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
         region: process.env.AWS_REGION,
      });
      // Guarda en la DynamoDB
      await saveDynamoDB(body);
      // Envio de Email con AWS SMS
      await sendEmail(body);
      return NextResponse.json({ message: 'Datos guardados en DynamoDB' });
   } catch (error: any) {
      const errorMessage = error.message.includes(':') ? error.message.split(': ')[1] : error.message;
      return NextResponse.json({ error: errorMessage }, { status: 500 });
   }
}
