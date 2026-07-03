import { registerEnumType } from '@nestjs/graphql';
import { AccountPrivacy } from '@prisma/client';

registerEnumType(AccountPrivacy, {
  name: 'AccountPrivacy',
});

export { AccountPrivacy };
