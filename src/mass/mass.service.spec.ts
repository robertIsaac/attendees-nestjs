import { Test, TestingModule } from '@nestjs/testing';
import { MassService } from './mass.service';

describe('MassService', () => {
  let service: MassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MassService],
    }).compile();

    service = module.get<MassService>(MassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
