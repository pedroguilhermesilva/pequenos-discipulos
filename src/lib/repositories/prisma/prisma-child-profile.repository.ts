import type { ChildProfile, PrismaClient } from '@prisma/client';
import type {
  ChildProfileRepository,
  CreateChildProfileInput,
} from '@/lib/repositories/interfaces/child-profile.repository';

export class PrismaChildProfileRepository implements ChildProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<ChildProfile | null> {
    return this.prisma.childProfile.findUnique({ where: { id } });
  }

  listByUser(userId: string): Promise<ChildProfile[]> {
    return this.prisma.childProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(data: CreateChildProfileInput): Promise<ChildProfile> {
    return this.prisma.childProfile.create({ data });
  }

  update(
    id: string,
    data: Partial<
      Pick<ChildProfile, 'name' | 'avatarColor' | 'hasCreatedStory'> & {
        preferences?: CreateChildProfileInput['preferences'];
      }
    >
  ): Promise<ChildProfile> {
    return this.prisma.childProfile.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.childProfile.delete({ where: { id } });
  }

  countByUser(userId: string): Promise<number> {
    return this.prisma.childProfile.count({ where: { userId } });
  }
}
