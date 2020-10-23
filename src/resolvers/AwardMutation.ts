import {
  Resolver, Mutation, Arg, Ctx,
} from 'type-graphql';
import { PrismaClient } from '@prisma/client';
import { Inject } from 'typedi';
import { Context } from '../context';
import { Award } from '../types/Award';

@Resolver(Award)
export class MemberMutation {
  @Inject(() => PrismaClient)
  private readonly prisma : PrismaClient;

  @Mutation(() => Boolean)
  async addAward(
    @Ctx() { auth }: Context,
    @Arg('project') project: string,
    @Arg('type') type: string,
    @Arg('modifier', { nullable: true }) modifier?: string,
  ): Promise<boolean> {
    const dbProject = await this.prisma.project.findFirst({ where: { id: project } });
    if (!dbProject || !await auth.isEventAdmin(dbProject.eventId)) {
      throw new Error('No permission to admin this project.');
    }

    if (await this.prisma.award.count({ where: { type, modifier, projectId: project } }) > 0) {
      throw new Error('Project has already recieved this award.');
    }

    await this.prisma.award.create({
      data: {
        type,
        modifier,
        project: {
          connect: {
            id: project,
          },
        },
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  async removeAward(
    @Ctx() { auth }: Context,
    @Arg('id') id: string,
  ) : Promise<boolean> {
    const dbAward = await this.prisma.award.findFirst({ where: { id }, include: { project: true } });
    if (!dbAward || !await auth.isEventAdmin(dbAward.project.eventId)) {
      throw new Error('No permission to admin this project.');
    }

    await this.prisma.award.delete({ where: { id } });
    return true;
  }
}
