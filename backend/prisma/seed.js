import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const videoUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

async function main() {
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.deadlineExtension.deleteMany();
  await prisma.manualSubmission.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.lessonCompletion.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.groupCourse.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const student = await prisma.user.create({
    data: {
      name: "Demo Student",
      email: "student@smartedu.local",
      passwordHash,
      notifications: {
        create: [
          { title: "Новый курс доступен", message: "Курс React Start уже можно проходить." },
          { title: "Проверь прогресс", message: "После прохождения теста статистика обновится автоматически." }
        ]
      }
    }
  });

  const secondStudent = await prisma.user.create({
    data: {
      name: "Ivan Petrov",
      email: "ivan@student.local",
      passwordHash
    }
  });

  const teacher = await prisma.user.create({
    data: {
      name: "Anna Teacher",
      email: "teacher@smartedu.local",
      passwordHash,
      role: "TEACHER",
      notifications: {
        create: {
          title: "Группа назначена",
          message: "Вы назначены преподавателем группы FE-101."
        }
      }
    }
  });

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@smartedu.local",
      passwordHash,
      role: "ADMIN",
      notifications: {
        create: {
          title: "Демо-данные готовы",
          message: "Созданы пользователи, курсы и учебная группа."
        }
      }
    }
  });

  const course = await prisma.course.create({
    data: {
      title: "React Start",
      description: "Практический курс по созданию интерфейсов на React: компоненты, состояние, роутинг и мини-проект.",
      category: "Frontend",
      level: "Beginner",
      duration: "6 часов",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      modules: {
        create: [
          {
            title: "Основы React",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Что такое компоненты",
                  type: "VIDEO",
                  order: 1,
                  duration: "12 мин",
                  videoUrl,
                  content: "Компоненты помогают разбивать интерфейс на независимые части."
                },
                {
                  title: "Тест по компонентам",
                  type: "TEST",
                  order: 2,
                  duration: "8 мин",
                  content: "Проверьте базовое понимание компонентов.",
                  test: {
                    create: {
                      title: "React Components Quiz",
                      description: "Короткий тест по компонентам React. Засчитывается лучший результат.",
                      attemptLimit: 2,
                      timeLimitMinutes: 10,
                      deadline: new Date("2026-12-31T20:59:59.000Z"),
                      creatorId: teacher.id,
                      questions: {
                        create: [
                          {
                            text: "Что возвращает React-компонент?",
                            type: "SINGLE_CHOICE",
                            maxScore: 10,
                            order: 1,
                            answers: {
                              create: [
                                { text: "JSX-разметку", isCorrect: true },
                                { text: "SQL-запрос", isCorrect: false },
                                { text: "Docker image", isCorrect: false }
                              ]
                            }
                          },
                          {
                            text: "Как передаются данные в компонент?",
                            type: "SINGLE_CHOICE",
                            maxScore: 10,
                            order: 2,
                            answers: {
                              create: [
                                { text: "Через props", isCorrect: true },
                                { text: "Только через localStorage", isCorrect: false },
                                { text: "Через CSS selector", isCorrect: false }
                              ]
                            }
                          },
                          {
                            text: "Объясните, когда компонент лучше вынести в отдельную часть интерфейса.",
                            type: "MANUAL",
                            maxScore: 20,
                            order: 3
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            title: "Навигация и состояние",
            order: 2,
            lessons: {
              create: {
                title: "Роутинг в приложении",
                type: "VIDEO",
                order: 1,
                duration: "15 мин",
                videoUrl,
                content: "React Router позволяет создавать страницы без перезагрузки."
              }
            }
          }
        ]
      }
    },
    include: { modules: { include: { lessons: true } } }
  });

  const group = await prisma.group.create({
    data: {
      title: "FE-101",
      teacherId: teacher.id,
      students: { connect: [{ id: student.id }, { id: secondStudent.id }] },
      courses: { create: { courseId: course.id } }
    }
  });

  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  await prisma.progress.create({
    data: {
      userId: student.id,
      courseId: course.id,
      totalLessons,
      completedLessons: 0,
      averageScore: 0,
      percent: 0
    }
  });

  await prisma.course.create({
    data: {
      title: "Backend API на Node.js",
      description: "Курс по REST API, Express, Prisma, PostgreSQL и JWT-авторизации.",
      category: "Backend",
      level: "Intermediate",
      duration: "8 часов",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
      modules: {
        create: {
          title: "Express Basics",
          order: 1,
          lessons: {
            create: {
              title: "Первый API endpoint",
              type: "VIDEO",
              order: 1,
              duration: "10 мин",
              videoUrl,
              content: "Express помогает быстро создавать HTTP API."
            }
          }
        }
      }
    }
  });

  console.log(`Seed data created for ${group.title}: ${student.email}, ${secondStudent.email}, ${teacher.email}, ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
