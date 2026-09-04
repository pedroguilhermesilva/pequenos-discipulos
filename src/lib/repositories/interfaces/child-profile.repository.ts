import type { ChildProfile, Prisma } from '@prisma/client';

export type CreateChildProfileInput = {
  id?: string;
  userId: string;
  name: string;
  avatarColor: string;
  preferences: Prisma.InputJsonValue;
  hasCreatedStory?: boolean;
};

export interface ChildProfileRepository {
  findById(id: string): Promise<ChildProfile | null>;
  listByUser(userId: string): Promise<ChildProfile[]>;
  create(data: CreateChildProfileInput): Promise<ChildProfile>;
  update(
    id: string,
    data: Partial<Pick<ChildProfile, 'name' | 'avatarColor' | 'hasCreatedStory'> & { preferences?: Prisma.InputJsonValue }>
  ): Promise<ChildProfile>;
  delete(id: string): Promise<void>;
  countByUser(userId: string): Promise<number>;
}
