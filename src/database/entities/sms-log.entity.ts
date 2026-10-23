import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'sms_logs' })
@Index(['templateType', 'createdAt'])
export class SmsLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'template_type', type: 'varchar', length: 64 })
  templateType!: string;

  @Column({ name: 'message_to', type: 'varchar', length: 32, nullable: true })
  messageTo!: string | null;

  @Column({ type: 'text' })
  body!: string;

  /** LOCAL | SENT | SKIPPED | FAILED */
  @Column({ type: 'varchar', length: 16 })
  status!: string;

  /** LOCAL | TWILIO */
  @Column({ type: 'varchar', length: 16 })
  provider!: string;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
