import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        // fontSrc: ["'self'"],
        // connectSrc: ["'self'"],
        // frameSrc: ["'none'"],
        // objectSrc: ["'none'"],
        // mediaSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Desabilita o COEP para evitar bloqueios de recursos externos
    hsts: { //Obriga o usuário a usar HTTPS
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true, // adiciona o domínio à lista de pré-carregamento do HSTS dos navegadores
    },
  })
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Marketplace API Gateway')
    .setDescription(
      `
      API Gateway para o sistema de Marketplace com microserviços

      Serviços Disponíveis:
      - Users Service: Autenticação e gestão de usuários
      - Products Service: Catálogo e gestão de produtos
      - Checkout Service: Carrinho e processamento de pedidos
      - Payments Service: Processamento de pagamentos

      Autenticação:
      - Use JWT Bearer token para rotas protegidas
      - Use Session token para validação de sessão
      `
    )
    .setVersion('1.0')
    .setContact(
      `Vizoto's Team`,
      'https://lucasvizoto.com',
      'lucasvizoto364@gmail.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-session-token',
        in: 'header',
        description: 'Enter session token',
      },
      'session-auth'
    )
    .addTag('Authentication', 'Endpoints relacionados à autenticação e autorização')
    .addTag('Users', 'Endpoints relacionados à gestão de usuários')
    .addTag('Products', 'Endpoints relacionados à gestão do catálogo de produtos')
    .addTag('Checkout', 'Endpoints relacionados ao carrinho e processamento de pedidos')
    .addTag('Payments', 'Endpoints relacionados ao processamento de pagamentos')
    .addTag('Health', 'Endpoints relacionados à saúde do sistema')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {},
    customSiteTitle: 'Marketplace API Gateway Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
    `,
  });

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`API Gateway is running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
