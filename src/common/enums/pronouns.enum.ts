import { registerEnumType } from '@nestjs/graphql';
import { Pronouns } from '@prisma/client';

registerEnumType(Pronouns, {
  name: 'Pronouns',
});

export { Pronouns };
