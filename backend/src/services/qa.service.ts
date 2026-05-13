import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';

class QaService {
  async getQuestions(productId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('product_qa').select('*, qa_answers(*)', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;

    return {
      questions: (data || []).map((q: any) => {
        const t = transformRow(q);
        t.answers = (q.qa_answers || []).map(transformRow);
        delete t.qaAnswers;
        return t;
      }),
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  async askQuestion(productId: string, userId: string, question: string) {
    const { data, error } = await supabase
      .from('product_qa').insert({ product_id: productId, user_id: userId, question }).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async answerQuestion(questionId: string, userId: string, answer: string, isAdmin: boolean = false) {
    const { data: qa } = await supabase.from('product_qa').select('id').eq('id', questionId).maybeSingle();
    if (!qa) throw new NotFoundError('Question');

    const { data, error } = await supabase
      .from('qa_answers').insert({
        question_id: questionId, user_id: userId, answer, is_admin_answer: isAdmin,
      }).select('*').single();
    if (error) throw error;
    return transformRow(data);
  }

  async getAllQuestions(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase.from('product_qa').select('*, qa_answers(*)', { count: 'exact' });
    if (query.unanswered === 'true') {
      // Filter questions with no answers - we'll filter after fetch
    }
    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    let questions = (data || []).map((q: any) => {
      const t = transformRow(q);
      t.answers = (q.qa_answers || []).map(transformRow);
      delete t.qaAnswers;
      return t;
    });

    if (query.unanswered === 'true') {
      questions = questions.filter((q: any) => !q.answers || q.answers.length === 0);
    }

    return {
      questions,
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    };
  }

  // Controller aliases
  async getByProduct(productId: string, pageOrQuery?: any, limit?: number) {
    if (typeof pageOrQuery === 'number') return this.getQuestions(productId, { page: pageOrQuery, limit });
    return this.getQuestions(productId, pageOrQuery);
  }
  async addAnswer(questionId: string, userId: string, answer: string, isAdmin?: boolean) { return this.answerQuestion(questionId, userId, answer, isAdmin); }
  async upvoteQuestion(questionId: string, _userId?: string) {
    const { data } = await supabase.from('product_qa').select('upvotes').eq('id', questionId).single();
    if (data) await supabase.from('product_qa').update({ upvotes: (data.upvotes || 0) + 1 }).eq('id', questionId);
  }
  async upvoteAnswer(_questionId: string, answerId: string, _userId?: string) {
    const { data } = await supabase.from('qa_answers').select('upvotes').eq('id', answerId).single();
    if (data) await supabase.from('qa_answers').update({ upvotes: (data.upvotes || 0) + 1 }).eq('id', answerId);
  }
  async deleteQuestion(questionId: string, _userId?: string, _isAdmin?: boolean) {
    // Delete linked answers first
    await supabase.from('qa_answers').delete().eq('question_id', questionId);
    // Then delete the question
    const { error } = await supabase.from('product_qa').delete().eq('id', questionId);
    if (error) throw error;
  }
  async deleteAnswer(_questionId: string, answerId: string, _userId?: string, _isAdmin?: boolean) {
    const { error } = await supabase.from('qa_answers').delete().eq('id', answerId);
    if (error) throw error;
  }
}

export default new QaService();
