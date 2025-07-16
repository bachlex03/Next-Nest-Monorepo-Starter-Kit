import { Test, TestingModule } from '@nestjs/testing'
import { EmrFormService } from './emr-form.service'

describe('EmrFormService', () => {
  let service: EmrFormService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmrFormService],
    }).compile()

    service = module.get<EmrFormService>(EmrFormService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
