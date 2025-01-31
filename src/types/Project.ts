import {
  ObjectType, Field, Ctx, Arg,
} from 'type-graphql';
import { PrismaClient } from '@prisma/client';
import { Container } from 'typedi';
import { ProjectType } from './ProjectType';
import { Media } from './Media';
import { Award } from './Award';
import { Member } from './Member';
import { Metadata } from './Metadata';
import { Judgement } from './Judgement';
import { MediaType } from './MediaType';
import { MediaTopic } from './MediaTopic';
import { ReactionCount } from './ReactionCount';
import { Context } from '../context';

@ObjectType()
export class Project {
  /* Metadata */
  @Field(() => String)
  id: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  /* Fields */
  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  featured: boolean;

  @Field(() => ProjectType)
  type: ProjectType;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  priorExperience?: string;

  @Field(() => String, { nullable: true })
  challengesEncountered?: string;

  @Field(() => String, { nullable: true })
  codeLink?: string;

  @Field(() => String, { nullable: true })
  viewLink?: string;

  /* Relations */
  @Field(() => String)
  eventId: string;

  @Field(() => String)
  programId: string;

  @Field(() => String, { nullable: true })
  eventGroupId?: string;

  @Field(() => String, { nullable: true })
  regionId?: string;

  @Field(() => [Media], { nullable: true })
  async media(
    @Ctx() ctx?: Context,
    @Arg('type', () => MediaType, { nullable: true }) type?: MediaType,
    @Arg('topics', () => [MediaTopic], { nullable: true }) topics?: MediaTopic[],
      @Arg('take', () => Number, { defaultValue: 100 }) take = 100,
  ): Promise<Media[]> {
    return <Promise<Media[]>><unknown> Container.get(PrismaClient).media.findMany({
      where: {
        project: { id: this.id },
        ...(type === MediaType.IMAGE && { type: MediaType.IMAGE }),
        ...(type === MediaType.VIDEO && { type: MediaType.VIDEO }),

        // Hide judges' media if the project doesn't have a published award yet.
        ...((this.awards && this.awards.length > 0) || ctx?.auth?.isEventAdmin(this.id)
          ? {}
          : { topic: { not: MediaTopic.JUDGES } }
        ),
        ...(topics && topics.length > 0 && {
          OR: topics
            .filter((t) => (
              (this.awards && this.awards.length > 0)
                || ctx?.auth?.isEventAdmin(this.id)
                || t !== MediaTopic.JUDGES
            ))
            .map((t) => ({ topic: t })),
        }),
      },
      take,
    });
  }

  @Field(() => [Award], { nullable: true })
  awards: Award[]

  @Field(() => [Member], { nullable: true })
  members: Member[]

  @Field(() => [ReactionCount])
  reactionCounts: ReactionCount[]

  @Field(() => [Judgement], { nullable: true })
  async userJudgement(
    @Ctx() { auth }: Context,
  ): Promise<Judgement[] | undefined> {
    if (!auth.judgingPoolId) throw new Error('You are not a judge.');
    if (!auth.isJudgeForProject(this)) throw new Error('You are not a judge for this project.');

    return <Promise<Judgement[]>><unknown> Container.get(PrismaClient).judgement.findMany({
      where: {
        judgingPool: { id: auth.judgingPoolId },
        project: { id: this.id },
        username: auth.username,
      },
      include: {
        judgingCriteria: {
          include: {
            judgingPool: true,
          },
        },
        judgingPool: true,
      },
      distinct: ['judgingCriteriaId'],
      orderBy: { createdAt: 'desc' },
    });
  }

  @Field(() => [String])
  async tags(
    @Ctx() ctx?: Context,
  ): Promise<string[]> {
    const tags = await Container.get(PrismaClient).tag.findMany({
      where: {
        projects: { some: { id: this.id }}
      },
    });
    return tags.map((t) => t.id);
  }


  @Field(() => [Metadata], { nullable: true })
  async metadata(
    @Ctx() ctx?: Context,
  ): Promise<Metadata[]> {
    return <Promise<Metadata[]>><unknown> Container.get(PrismaClient).metadata.findMany({
      where: {
        projectId: this.id,
        OR: ctx?.auth ? ctx.auth.visibilityConditions(this) : [{ visibility: 'PUBLIC' }],
      },
    });
  }

  @Field(() => String, { nullable: true })
  async metadataValue(
    @Ctx() { auth }: Context,
    @Arg('key') key: string,
  ): Promise<string> {
    const metadata = <Metadata><unknown> await Container.get(PrismaClient).metadata.findFirst({
      where: {
        projectId: this.id,
        key,
        OR: auth.visibilityConditions(this),
      },
    });
    return metadata?.value;
  }

  @Field(() => Boolean, { name: 'canEdit' })
  async canEdit(
    @Ctx() { auth }: Context,
  ): Promise<boolean> {
    return auth.isProjectAdmin(this);
  }

  @Field(() => Boolean, { name: 'canAdmin' })
  async canAdmin(
    @Ctx() { auth }: Context,
  ): Promise<boolean> {
    return auth.isEventAdmin(this.eventId);
  }
}
