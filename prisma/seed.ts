import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter } as never);

const EXERCISE_CONFIGS = [
  {
    exerciseType: "CARD_MEMORY",
    titleZh: "纸牌记忆",
    descriptionZh: "记住两张牌的花色和点数，翻面后说出来",
    difficulty: 2,
    configData: JSON.stringify({}),
  },
  {
    exerciseType: "IDENTIFY_PEOPLE",
    titleZh: "认人认物",
    descriptionZh: "看照片，说出这是谁或这是什么",
    difficulty: 1,
    configData: JSON.stringify({ photosRequired: true }),
  },
  {
    exerciseType: "REMEMBER_WORDS",
    titleZh: "记3样东西",
    descriptionZh: "记住几个词，过一会儿再回答",
    difficulty: 2,
    configData: JSON.stringify({
      wordCount: 3,
      delaySeconds: 60,
      wordLists: [
        ["苹果", "杯子", "猫"],
        ["椅子", "花", "书"],
        ["鱼", "钥匙", "帽子"],
        ["月亮", "手机", "茶"],
        ["碗", "狗", "树"],
      ],
    }),
  },
  {
    exerciseType: "DATE_ORIENTATION",
    titleZh: "今天是什么时候",
    descriptionZh: "回答关于今天日期和时间的问题",
    difficulty: 1,
    configData: JSON.stringify({}),
  },
  {
    exerciseType: "COUNTING",
    titleZh: "数数",
    descriptionZh: "从1数到10，或倒着数",
    difficulty: 1,
    configData: JSON.stringify({
      modes: ["forward", "backward", "skip2"],
    }),
  },
  {
    exerciseType: "COLOR_CATEGORY",
    titleZh: "找颜色/分类",
    descriptionZh: "找出指定颜色的东西，或把东西分类",
    difficulty: 2,
    configData: JSON.stringify({
      categories: [
        { name: "水果", items: ["苹果", "香蕉", "橙子", "葡萄", "西瓜"] },
        { name: "蔬菜", items: ["白菜", "萝卜", "土豆", "西红柿", "黄瓜"] },
        { name: "动物", items: ["猫", "狗", "鸟", "鱼", "兔子"] },
      ],
      colors: ["红色", "黄色", "绿色", "蓝色"],
    }),
  },
  {
    exerciseType: "OBJECT_MEMORY",
    titleZh: "记物品名字",
    descriptionZh: "记住三样东西，翻面后选出来",
    difficulty: 1,
    configData: JSON.stringify({}),
  },
  {
    exerciseType: "COMMON_SENSE",
    titleZh: "常识问答",
    descriptionZh: "回答简单的历史、地理、国家常识题",
    difficulty: 1,
    configData: JSON.stringify({}),
  },
  {
    exerciseType: "MIRROR_ACTIONS",
    titleZh: "跟着做动作",
    descriptionZh: "跟着做简单的动作，比如拍手、举手",
    difficulty: 1,
    configData: JSON.stringify({
      actions: [
        { name: "拍手", instruction: "请跟着拍一下手" },
        { name: "举手", instruction: "请把手举起来" },
        { name: "摸鼻子", instruction: "请摸一下鼻子" },
        { name: "摸耳朵", instruction: "请摸一下耳朵" },
        { name: "点头", instruction: "请点一下头" },
      ],
    }),
  },
  {
    exerciseType: "SIMPLE_SENTENCES",
    titleZh: "拼简单句子",
    descriptionZh: "回答简单的日常问题",
    difficulty: 2,
    configData: JSON.stringify({
      questions: [
        "今天天气怎么样？",
        "你早饭吃了什么？",
        "你最喜欢什么水果？",
        "你平时喜欢做什么？",
        "你家里有几口人？",
      ],
    }),
  },
  {
    exerciseType: "PATTERN_MEMORY",
    titleZh: "图案记忆",
    descriptionZh: "记住亮起的格子，等一会儿再选出来",
    difficulty: 2,
    configData: JSON.stringify({ gridSize: 9, litCount: [3, 4], showSeconds: 5 }),
  },
  {
    exerciseType: "LONG_TERM_RECALL",
    titleZh: "回忆熟悉的事",
    descriptionZh: "回忆小时候或以前的事情",
    difficulty: 1,
    configData: JSON.stringify({
      questions: [
        "你小时候住在哪里？",
        "你最喜欢吃什么？",
        "你小时候上什么学校？",
        "你最喜欢的季节是什么？",
        "你年轻时喜欢做什么？",
      ],
    }),
  },
  {
    exerciseType: "POEM_RECITE",
    titleZh: "跟读古诗",
    descriptionZh: "跟着一句一句朗读唐诗宋词",
    difficulty: 1,
    configData: JSON.stringify({}),
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create exercise configs
  for (const config of EXERCISE_CONFIGS) {
    await prisma.exerciseConfig.upsert({
      where: { exerciseType: config.exerciseType },
      update: config,
      create: config,
    });
  }
  console.log("✅ Exercise configs created");

  // Create demo caregiver account
  const caregiverPin = await bcrypt.hash("1234", 10);
  const caregiver = await prisma.user.upsert({
    where: { username: "caregiver" },
    update: {},
    create: {
      username: "caregiver",
      pin: caregiverPin,
      role: "CAREGIVER",
      displayName: "家人",
    },
  });
  console.log("✅ Caregiver account created (username: caregiver, PIN: 1234)");

  // Create demo senior account
  const seniorPin = await bcrypt.hash("0000", 10);
  const senior = await prisma.user.upsert({
    where: { username: "senior" },
    update: {},
    create: {
      username: "senior",
      pin: seniorPin,
      role: "SENIOR",
      displayName: "妈妈",
    },
  });
  console.log("✅ Senior account created (username: senior, PIN: 0000)");

  // Link caregiver to senior
  await prisma.user.update({
    where: { id: caregiver.id },
    data: { seniorId: senior.id },
  });
  console.log("✅ Caregiver linked to senior");

  // Create default test account (caregiver)
  const userPin = await bcrypt.hash("0000", 10);
  await prisma.user.upsert({
    where: { username: "user" },
    update: { pin: userPin, role: "SENIOR", seniorId: null },
    create: {
      username: "user",
      pin: userPin,
      role: "SENIOR",
      displayName: "妈妈",
    },
  });
  console.log("✅ Default account created (username: user, PIN: 0000, role: SENIOR)");

  console.log("\n🎉 Seed complete!");
  console.log("   Default login:   username=user       PIN=0000");
  console.log("   Caregiver login: username=caregiver  PIN=1234");
  console.log("   Senior login:    username=senior     PIN=0000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
