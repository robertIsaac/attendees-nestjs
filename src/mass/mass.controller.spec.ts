import { Test, TestingModule } from '@nestjs/testing';
import { MassController } from './mass.controller';
import { MassService } from './mass.service';

describe('MassController', () => {
  let controller: MassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MassController],
      providers: [MassService],
    }).compile();

    controller = module.get<MassController>(MassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
