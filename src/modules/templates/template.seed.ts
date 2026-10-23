export type SmsSeed = { templateType: string; body: string };

export type PushSeed = {
  templateType: string;
  title: string;
  body: string;
  channelId: string;
  loud: boolean;
};

export const SMS_TEMPLATES: SmsSeed[] = [
  {
    templateType: 'AUTH_OTP',
    body: '[CODE] is your Nearo code. It expires in [MINUTES] minutes.',
  },
];

/** Human chrome only. templateType is the lookup key, never the title. */
export const PUSH_TEMPLATES: PushSeed[] = [
  {
    templateType: 'AUTH_OTP',
    title: 'Your Nearo code',
    body: '[CODE] expires in [MINUTES] min',
    channelId: 'nearo_otp',
    loud: false,
  },
  {
    templateType: 'JOB_BROADCAST_HELPER',
    title: 'New job nearby',
    body: 'A customer needs help nearby.',
    channelId: 'nearo_jobs_loud',
    loud: true,
  },
  {
    templateType: 'JOB_TAKEN_HELPER',
    title: 'Job taken',
    body: 'Another helper accepted this job.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_ASSIGNED_CUSTOMER',
    title: 'Helper assigned',
    body: 'A helper accepted your request.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_ASSIGNED_HELPER',
    title: 'You got the job',
    body: 'Head to the customer when ready.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_EN_ROUTE_CUSTOMER',
    title: 'Helper is on the way',
    body: 'Your helper is heading to you.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_ARRIVED_CUSTOMER',
    title: 'Helper has arrived',
    body: 'Your helper is at the location.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_STARTED_CUSTOMER',
    title: 'Work in progress',
    body: 'The job has started.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_COMPLETED_CUSTOMER',
    title: 'Job done',
    body: 'This request is complete.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_COMPLETED_HELPER',
    title: 'Job completed',
    body: 'You finished this job.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_CANCELLED_CUSTOMER',
    title: 'Cancelled',
    body: 'This request was cancelled.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_CANCELLED_HELPER',
    title: 'Customer cancelled',
    body: 'The customer cancelled this job.',
    channelId: 'nearo_jobs',
    loud: false,
  },
  {
    templateType: 'JOB_REOPENED_CUSTOMER',
    title: 'Looking for another helper',
    body: 'We are finding someone else.',
    channelId: 'nearo_jobs',
    loud: false,
  },
];

const RAW_ENUM =
  /^(BROADCASTING|ASSIGNED|EN_ROUTE|ARRIVED|ON_JOB|COMPLETED|CANCELLED|HELPER_DROPPED|BROADCAST|ACCEPTED|AUTH_OTP|IND|AC_REPAIR)$/;

export function chromeIsHuman(title: string, body: string): boolean {
  return !RAW_ENUM.test(title) && !RAW_ENUM.test(body);
}
