import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.examResult.findFirst({
    where: { id: 4 }, // Based on previous dump
    include: { exam: true }
  });

  if (!result) return console.log("Result not found");

  const answers = JSON.parse(result.answersJson);
  const qIds = Object.keys(answers).map(id => parseInt(id));

  const questions = await prisma.question.findMany({
    where: { id: { in: qIds } },
    include: { answers: true }
  });

  console.log("DEBUG_CALCULATION:");
  questions.forEach(q => {
      const studentAns = answers[q.id.toString()];
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const correctAns = q.answers.find(a => a.isRight);
      const correctIdx = correctAns ? q.answers.indexOf(correctAns) : -1;
      const correctLabel = correctIdx !== -1 ? labels[correctIdx] : 'NONE';
      
      console.log(`Q#${q.id}: Student=${studentAns}, Correct=${correctLabel}, Match=${studentAns === correctLabel}`);
      console.log(`Answers Order:`, q.answers.map(a => `${a.id}:${a.isRight}`));
  });
  
  await prisma.$disconnect();
}
main();
