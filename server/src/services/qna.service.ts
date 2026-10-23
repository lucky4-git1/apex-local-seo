import { db } from '../db/index.js';
import { QuestionAnswer } from '../types/index.js';
import { ProfileService } from './profile.service.js';

export class QnaService {
  static getQuestions(locationId: string): QuestionAnswer[] {
    const rows = db.prepare('SELECT * FROM questions_answers WHERE location_id = ? ORDER BY create_time DESC').all(locationId) as any[];
    return rows.map(r => ({
      id: r.id,
      locationId: r.location_id,
      authorName: r.author_name,
      questionText: r.question_text,
      createTime: r.create_time,
      answerText: r.answer_text,
      answerStatus: r.answer_status,
      answerAuthor: r.answer_author,
      answerTime: r.answer_time
    }));
  }

  static publishAnswer(questionId: string, answerText: string, authorName: string): QuestionAnswer {
    const answerTime = new Date().toISOString();
    db.prepare(`
      UPDATE questions_answers SET
        answer_text = ?,
        answer_status = 'PUBLISHED',
        answer_author = ?,
        answer_time = ?
      WHERE id = ?
    `).run(answerText, authorName, answerTime, questionId);

    const row = db.prepare('SELECT * FROM questions_answers WHERE id = ?').get(questionId) as any;
    return {
      id: row.id,
      locationId: row.location_id,
      authorName: row.author_name,
      questionText: row.question_text,
      createTime: row.create_time,
      answerText: row.answer_text,
      answerStatus: row.answer_status,
      answerAuthor: row.answer_author,
      answerTime: row.answer_time
    };
  }

  static suggestAnswer(questionId: string): { suggestedAnswer: string } {
    const q = db.prepare('SELECT * FROM questions_answers WHERE id = ?').get(questionId) as any;
    if (!q) throw new Error('Question not found');
    const loc = ProfileService.getLocation(q.location_id);

    let answer = `Hello ${q.author_name}, thank you for reaching out to ${loc?.title || 'our office'}! `;
    if (q.question_text.toLowerCase().includes('parking')) {
      answer += 'We validate parking for up to 1 hour at the nearby public parking structure. Please bring your ticket to our front desk upon check-in!';
    } else if (q.question_text.toLowerCase().includes('insurance')) {
      answer += 'We accept most major PPO dental insurance plans and are happy to conduct a complimentary benefits check prior to your appointment.';
    } else {
      answer += `We are happy to answer your questions. Please feel free to give our team a call at ${loc?.phoneNumber || 'our office'} for direct assistance!`;
    }

    return { suggestedAnswer: answer };
  }
}
