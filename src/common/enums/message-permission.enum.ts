import { registerEnumType } from '@nestjs/graphql';
import { MessagePermission } from '@prisma/client';

registerEnumType(MessagePermission, {
  name: 'MessagePermission',
});

export { MessagePermission };
