import type { FlowSchema } from '../types/flow';
import { MUNSIT_DEFAULT_VOICE_ID } from '../config/munsit';

export const DEFAULT_FLOW: FlowSchema = {
  version: '1.0.0',
  name: 'Shifa Care Insurance & Coverage Verification',
  nodes: [
    {
      id: 'node_start',
      type: 'start',
      label: 'بدء المكالمة (Start Call)',
      position: { x: 50, y: 50 },
      config: { bilingualMode: true, voiceId: MUNSIT_DEFAULT_VOICE_ID },
      outputs: ['node_greeting']
    },
    {
      id: 'node_greeting',
      type: 'say',
      label: 'ترحيب المريض (Greeting)',
      position: { x: 350, y: 50 },
      config: {
        speechAr: 'أهلاً بك في مستشفيات شفاء كير. معك مساعدك الصوتي الذكي. كيف يمكنني مساعدتك اليوم؟',
        speechEn: 'Welcome to Shifa Care Hospitals. Your AI voice assistant here. How can I help you today?',
        bilingualMode: true
      },
      outputs: ['node_ask_member']
    },
    {
      id: 'node_ask_member',
      type: 'ask',
      label: 'طلب رقم العضوية (Ask Member ID)',
      position: { x: 650, y: 50 },
      config: {
        speechAr: 'من فضلك، زودني برقم بطاقة التأمين الطبي أو رقم الهوية.',
        speechEn: 'Please provide your medical insurance ID or national ID number.',
        expectedVariable: 'member_id',
        variableType: 'string'
      },
      outputs: ['node_check_coverage']
    },
    {
      id: 'node_check_coverage',
      type: 'tool',
      label: 'فحص التغطية (Verify Coverage API)',
      position: { x: 980, y: 50 },
      config: {
        toolName: 'verify_insurance_api',
        toolParams: '{"member_id": "{{member_id}}"}'
      },
      outputs: ['node_condition_coverage']
    },
    {
      id: 'node_condition_coverage',
      type: 'condition',
      label: 'تقييم التغطية (Coverage Active?)',
      position: { x: 1320, y: 50 },
      config: { conditionExpression: "api_result.status == 'active'" },
      outputs: ['node_approved_msg', 'node_transfer_agent']
    },
    {
      id: 'node_approved_msg',
      type: 'say',
      label: 'تأكيد الموافقة (Approval Confirmed)',
      position: { x: 1680, y: -40 },
      config: {
        speechAr: 'تأمينك نشط وصالح لتغطية الإجراء الطبي المطلوب. هل تحجز موعداً الآن؟',
        speechEn: 'Your insurance is active and covers the procedure. Would you like to book an appointment now?'
      },
      outputs: ['node_end_success']
    },
    {
      id: 'node_transfer_agent',
      type: 'transfer',
      label: 'تحويل لموظف (Transfer to Human)',
      position: { x: 1680, y: 150 },
      config: {
        transferTarget: 'insurance_billing_department',
        speechAr: 'عذراً، تحتاج مراجعة قسم المطالبات. جاري تحويلك لأحد المختصين لدينا.',
        speechEn: 'Apologies, your claim requires review. Transferring you to our billing specialist.'
      },
      outputs: ['node_end_transfer']
    },
    {
      id: 'node_end_success',
      type: 'end',
      label: 'إنهاء بنجاح (End Success)',
      position: { x: 2020, y: -40 },
      config: {},
      outputs: []
    },
    {
      id: 'node_end_transfer',
      type: 'end',
      label: 'إنهاء بتحويل (End Transfer)',
      position: { x: 2020, y: 150 },
      config: {},
      outputs: []
    }
  ]
};
