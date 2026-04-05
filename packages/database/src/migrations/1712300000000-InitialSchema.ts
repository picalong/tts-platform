import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1712300000000 implements MigrationInterface {
  name = "InitialSchema1712300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`credits\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`tier\` enum('free','pro','enterprise') NOT NULL DEFAULT 'free',
        \`stripe_customer_id\` varchar(255) DEFAULT NULL,
        \`stripe_subscription_id\` varchar(255) DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_users_email\` (\`email\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`voices\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`provider\` varchar(100) NOT NULL,
        \`language\` varchar(10) NOT NULL,
        \`gender\` enum('male','female','neutral') NOT NULL,
        \`type\` enum('standard','neural','premium') NOT NULL,
        \`preview_url\` varchar(1024) DEFAULT NULL,
        \`credit_cost_per_1k_chars\` decimal(5,2) NOT NULL DEFAULT 1.00,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`tts_jobs\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`text\` text NOT NULL,
        \`voice_id\` varchar(36) NOT NULL,
        \`speed\` decimal(3,2) NOT NULL DEFAULT 1.00,
        \`pitch\` decimal(4,2) NOT NULL DEFAULT 0.00,
        \`status\` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
        \`audio_url\` varchar(1024) DEFAULT NULL,
        \`error_message\` text DEFAULT NULL,
        \`credit_cost\` decimal(10,2) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` datetime(6) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_tts_jobs_status\` (\`status\`),
        KEY \`IDX_tts_jobs_user_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_tts_jobs_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`credit_transactions\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`type\` enum('purchase','usage','refund','bonus') NOT NULL,
        \`amount\` decimal(10,2) NOT NULL,
        \`balance_after\` decimal(10,2) NOT NULL,
        \`description\` varchar(500) NOT NULL,
        \`reference_id\` varchar(36) DEFAULT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_credit_tx_user_created\` (\`user_id\`, \`created_at\`),
        CONSTRAINT \`FK_credit_tx_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      INSERT INTO \`voices\` (\`id\`, \`name\`, \`provider\`, \`language\`, \`gender\`, \`type\`, \`credit_cost_per_1k_chars\`, \`is_active\`) VALUES
        (UUID(), 'Google en-US-Standard-A', 'google', 'en-US', 'female', 'standard', 1.00, 1),
        (UUID(), 'Google en-US-Standard-B', 'google', 'en-US', 'male', 'standard', 1.00, 1),
        (UUID(), 'Azure en-US-JennyNeural', 'azure', 'en-US', 'female', 'neural', 1.50, 1),
        (UUID(), 'OpenAI alloy', 'openai', 'en-US', 'neutral', 'premium', 2.00, 1),
        (UUID(), 'OpenAI echo', 'openai', 'en-US', 'male', 'premium', 2.00, 1);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`credit_transactions\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`tts_jobs\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`voices\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
  }
}
