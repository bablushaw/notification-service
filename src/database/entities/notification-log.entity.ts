import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'notification_logs' })
@Index(['templateType', 'createdAt'])
export class NotificationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'template_type', type: 'varchar', length: 64 })
  templateType!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  token!: string | null;

  @Column({ type: 'varchar', length: 180 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ name: 'channel_id', type: 'varchar', length: 64, nullable: true })
  channelId!: string | null;

  /** SENT | SKIPPED | FAILED */
  @Column({ type: 'varchar', length: 16 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
