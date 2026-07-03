import { registerEnumType } from '@nestjs/graphql';
import { AccountType } from '@prisma/client';

registerEnumType(AccountType, {
  name: 'AccountType',
});

export { AccountType };
