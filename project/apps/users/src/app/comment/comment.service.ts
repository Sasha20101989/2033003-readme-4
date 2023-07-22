import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Comment } from '@project/shared/app-types';
import { CommentMemoryRepository } from './comment-memory.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { COMMENT_TEXT_MIN_LENGTH, COMMENT_TEXT_MAX_LENGTH } from './comment.constant';
import { CommentEntity } from './comment.entity';
import dayjs from 'dayjs';
import { UserRole } from 'libs/shared/app-types/src';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentMemoryRepository
  ) {}

  public async create(dto: CreateCommentDto) {
    const { text, publicationId } = dto;

    if (text.length < COMMENT_TEXT_MIN_LENGTH || text.length > COMMENT_TEXT_MAX_LENGTH) {
      throw new BadRequestException('Invalid comment text length');
    }

    const comment = {
      text,
      createdAt: dayjs().toDate(),
      author: {
        email: '',
        firstname: '',
        lastname: '', 
        passwordHash: '',
        avatar: '', 
        dateRegister: dayjs().toDate(),
        role: UserRole.User
      },
      publicationId,
    };

    const commentEntity = await new CommentEntity(comment);

    return this.commentRepository.create(commentEntity);
  }

  public async delete(commentId: string, userId: string) {
    const comment = await this.commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.author._id !== userId) {
      throw new UnauthorizedException('You are not authorized to delete this comment');
    }

    return this.commentRepository.destroy(commentId);
  }

  public async findCommentsByPublication(publicationId: string, limit: number): Promise<Comment[]> {
    return this.commentRepository.findCommentsByPublication(publicationId, limit);
  }

  public async findNextComments(lastCommentId: string, limit: number): Promise<Comment[]> {
    const comments: Comment[] = await this.commentRepository.findNextComments(lastCommentId, limit);
    if(!comments){
      throw new BadRequestException('Invalid lastCommentId');
    }

    return comments;
  }
}
