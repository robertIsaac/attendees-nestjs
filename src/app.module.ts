import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookModule } from './book/book.module';
import { HeaderResolver, I18nJsonParser, I18nModule } from 'nestjs-i18n';
import { MassModule } from './mass/mass.module';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const mongoHost = configService.get('MONGO_HOST');
        const mongoPort = configService.get('MONGO_PORT');
        const mongoUsername = configService.get('MONGO_USERNAME');
        const mongoPassword = configService.get('MONGO_PASSWORD');
        const mongoDatabase = configService.get('MONGO_DATABASE');
        const mongoConnectionFormat = configService.get('MONGO_CONNECTION_FORMAT');
        const mongoConnectionOptions = configService.get('MONGO_CONNECTION_OPTIONS');

        const port = mongoPort ? `:${mongoPort}` : '';

        let mongoCredentials = '';
        if (mongoUsername && mongoPassword) {
          mongoCredentials = `${mongoUsername}:${mongoPassword}@`;
        } else if (mongoUsername) {
          mongoCredentials = `${mongoUsername}@`;
        }

        const options = mongoConnectionOptions ? `?${mongoConnectionOptions}` : '';

        const mongoUrl = `${mongoConnectionFormat}://${mongoCredentials}${mongoHost}${port}/${mongoDatabase}${options}`;

        return {
          type: 'mongodb',
          url: mongoUrl,
          ssl: configService.get('MONGO_SSL', 'true') === 'true',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '/i18n/'),
      },
      resolvers: [new HeaderResolver(['x-lang'])],
    }),

    AuthModule,
    UsersModule,
    BookModule,
    MassModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
