-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inAppLetterViewed" BOOLEAN NOT NULL DEFAULT true,
    "inAppPaymentClaimed" BOOLEAN NOT NULL DEFAULT true,
    "emailLetterViewed" BOOLEAN NOT NULL DEFAULT false,
    "emailPaymentClaimed" BOOLEAN NOT NULL DEFAULT true,
    "tgLetterViewed" BOOLEAN NOT NULL DEFAULT false,
    "tgPaymentClaimed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT,
    "telegramToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_sessions_userId_key" ON "telegram_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_sessions_chatId_key" ON "telegram_sessions"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_sessions_telegramToken_key" ON "telegram_sessions"("telegramToken");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
