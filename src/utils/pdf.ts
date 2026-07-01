import jsPDF from 'jspdf';
import { chapterQuestions } from '../data/questions';
import { UserAnswers } from '../types/questions';

export async function generatePDF(userAnswers: UserAnswers): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  doc.setFont('serif', 'bold');
  doc.setFontSize(24);
  doc.text('Livro Digital - Gabarito do Professor', margin, yPosition);
  yPosition += 15;

  doc.setFont('sans-serif', 'normal');
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${date}`, margin, yPosition);
  yPosition += 15;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);

  for (const [chapterId, questions] of Object.entries(chapterQuestions)) {
    const chapterNumber = chapterId === 'chapter1' ? 1 : 2;

    if (yPosition + 20 > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('serif', 'bold');
    doc.setFontSize(14);
    yPosition += 5;
    doc.text(`Capítulo ${chapterNumber}`, margin, yPosition);
    yPosition += 10;

    doc.setFont('sans-serif', 'normal');
    doc.setFontSize(10);

    questions.forEach((question, index) => {
      if (yPosition + 20 > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      const userAnswer = userAnswers[question.id];

      doc.setFont('sans-serif', 'bold');
      doc.setFontSize(11);
      const questionText = `${index + 1}. ${question.question}`;
      const wrappedQuestion = doc.splitTextToSize(questionText, maxWidth - 5);
      doc.text(wrappedQuestion, margin + 5, yPosition);
      yPosition += wrappedQuestion.length * 5 + 2;

      doc.setFont('sans-serif', 'normal');
      doc.setFontSize(10);

      if (question.type === 'multiple-choice') {
        const correctAnswer = question.correctAnswer.toUpperCase();
        doc.text(`Resposta correta: ${correctAnswer})`, margin + 10, yPosition);
        yPosition += 5;

        if (userAnswer) {
          const isCorrect = userAnswer === question.correctAnswer;
          doc.setTextColor(isCorrect ? 0 : 255, isCorrect ? 128 : 0, 0);
          const userAnswerUpper = String(userAnswer).toUpperCase();
          doc.text(`Resposta do aluno: ${userAnswerUpper})`, margin + 10, yPosition);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text('Resposta do aluno: Não respondida', margin + 10, yPosition);
        }
        yPosition += 5;
      } else if (question.type === 'true-false') {
        const correctText = question.correctAnswer ? 'Verdadeiro' : 'Falso';
        doc.text(`Resposta correta: ${correctText}`, margin + 10, yPosition);
        yPosition += 5;

        if (userAnswer !== undefined) {
          const isCorrect = userAnswer === question.correctAnswer;
          const userAnswerText = userAnswer ? 'Verdadeiro' : 'Falso';
          doc.setTextColor(isCorrect ? 0 : 255, isCorrect ? 128 : 0, 0);
          doc.text(`Resposta do aluno: ${userAnswerText}`, margin + 10, yPosition);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text('Resposta do aluno: Não respondida', margin + 10, yPosition);
        }
        yPosition += 5;
      } else if (question.type === 'alternative') {
        const correctOption = question.options[question.correctAnswer];
        doc.text(`Resposta correta: ${correctOption}`, margin + 10, yPosition);
        yPosition += 5;

        if (userAnswer !== undefined) {
          const isCorrect = userAnswer === question.correctAnswer;
          const userOption = question.options[userAnswer as number];
          doc.setTextColor(isCorrect ? 0 : 255, isCorrect ? 128 : 0, 0);
          doc.text(`Resposta do aluno: ${userOption}`, margin + 10, yPosition);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text('Resposta do aluno: Não respondida', margin + 10, yPosition);
        }
        yPosition += 5;
      }

      yPosition += 8;
    });

    yPosition += 5;
  }

  doc.save('livro-gabarito-professor.pdf');
}
