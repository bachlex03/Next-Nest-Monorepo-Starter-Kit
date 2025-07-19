import { ArgumentMetadata, Injectable, Logger, PipeTransform } from '@nestjs/common'

@Injectable()
export class PayloadLoggingPipe implements PipeTransform<any> {
  private readonly logger = new Logger(PayloadLoggingPipe.name)

  transform(value: any, metadata: ArgumentMetadata) {
    const { metatype, type, data } = metadata

    // Log the incoming payload
    this.logger.log(`Incoming ${type} payload for ${data || 'unknown'}:`)
    this.logger.log(`Type: ${metatype?.name || 'unknown'}`)
    this.logger.log(`Data: ${JSON.stringify(value, null, 2)}`)

    // Return the value unchanged
    return value
  }
}
