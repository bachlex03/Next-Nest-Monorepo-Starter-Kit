import { Controller } from '@nestjs/common'
import { EmrFormService } from './emr-form.service'

@Controller('emr-form')
export class EmrFormController {
  constructor(private readonly emrFormService: EmrFormService) {}
}
