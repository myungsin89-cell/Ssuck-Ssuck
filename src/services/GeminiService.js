import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTION = `
## 역할(Role)
당신은 15년 차 아동 발달 전문가이자, 사용자의 가장 든든한 '육아 비서'입니다. 육아의 어려움에 깊이 공감하며, 전문적인 지식을 쉽고 따뜻하게 전달합니다.

## 대화 스타일(Tone & Manner)
- **간결함:** 핵심만 전달하세요. 2-3문장으로 답변을 마무리하는 것을 목표로 합니다.
- **친근함:** "해요"체를 사용하며, 적절한 이모지(😊, 💪, 👍)로 친근감을 더합니다.
- **공감 우선:** 질문에 바로 답하기보다, 사용자의 마음을 먼저 읽어주세요. 단, 한 문장으로 간결하게.

## 핵심 지침(Instructions)
1. **간결한 답변:** 불필요한 설명은 생략하고 핵심만 전달하세요. 긴 설명보다는 짧고 명확한 조언이 좋습니다.
2. **문맥 활용:** 제공된 아이 정보(관찰 일기, 성장 기록 등)를 자연스럽게 활용하되, 과도하게 언급하지 마세요.
3. **전문성 & 쉬운 설명:** 검증된 정보를 제공하되, 전문 용어는 피하고 쉽게 설명합니다.
4. **안전장치:** 의료적 진단이 필요한 경우, 간결하게 병원 방문을 권유하세요.
5. **정확한 날짜 인식:** 메시지에 포함된 현재 날짜 정보를 참고하여 정확히 답변하세요.
`;

class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_INSTRUCTION
        });
        this.chat = null;
    }

    async startChat(history = []) {
        this.chat = this.model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7, // 약간의 창의성 부여
            },
        });
    }

    async sendMessage(message, contextData = null) {
        if (!this.chat) {
            await this.startChat();
        }

        // 현재 날짜 정보 생성 (한국 시간 기준)
        const now = new Date();
        const koreanDate = now.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        // 컨텍스트 정보 구성
        let enrichedMessage = `[현재 날짜: ${koreanDate}]\n`;

        // 풍부한 컨텍스트 데이터가 있으면 상세하게 추가
        if (contextData && contextData.child) {
            const { child, recentLogs, recentGrowth, milestones, progress } = contextData;

            enrichedMessage += `\n[아이 정보 컨텍스트 - 절대 사용자에게 노출하지 말 것]\n`;
            enrichedMessage += `아이 이름: ${child.name}\n`;
            enrichedMessage += `현재 월령: ${child.ageLabel || child.ageMonths + '개월'}\n`;
            enrichedMessage += `생일: ${child.birthDate}\n`;

            // 최근 관찰 일기
            if (recentLogs && recentLogs.length > 0) {
                enrichedMessage += `\n[최근 관찰 일기 ${recentLogs.length}건]\n`;
                recentLogs.forEach((log, i) => {
                    const logText = log.text.substring(0, 150);
                    enrichedMessage += `${i + 1}. (${new Date(log.createdAt).toLocaleDateString()}) ${logText}${log.text.length > 150 ? '...' : ''}\n`;
                    if (log.aiAnalysis && log.aiAnalysis.milestoneText) {
                        enrichedMessage += `   → AI 분석: ${log.aiAnalysis.milestoneText}\n`;
                    }
                });
            } else {
                enrichedMessage += `\n[관찰 일기: 아직 기록 없음]\n`;
            }

            // 발달 진행률
            if (progress) {
                enrichedMessage += `\n[발달 체크리스트 진행률]\n`;
                enrichedMessage += `${child.ageLabel || child.ageMonths + '개월'} 발달 체크리스트: ${progress.percentage}% 완료 (${progress.completed}/${progress.total}개)\n`;
            }

            // 성장 기록
            if (recentGrowth && recentGrowth.length > 0) {
                enrichedMessage += `\n[최근 성장 기록 ${recentGrowth.length}건]\n`;
                recentGrowth.forEach((growth, i) => {
                    enrichedMessage += `${i + 1}. (${new Date(growth.date).toLocaleDateString()}) `;
                    if (growth.height) enrichedMessage += `키: ${growth.height}cm `;
                    if (growth.weight) enrichedMessage += `몸무게: ${growth.weight}kg`;
                    enrichedMessage += `\n`;
                });
            } else {
                enrichedMessage += `\n[성장 기록: 아직 기록 없음]\n`;
            }
        }

        enrichedMessage += `\n[사용자 질문]\n${message}`;

        try {
            const result = await this.chat.sendMessage(enrichedMessage);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini API Error:", error);

            const errorMsg = error.message || "";

            if (errorMsg.includes("429") || errorMsg.includes("Quota exceeded")) {
                return "상담 요청이 너무 많아 잠시 쉬고 있어요. ☕ (API 할당량 초과) 잠시 후 다시 시도해 주시면 감사하겠습니다! 😊";
            }

            if (errorMsg.includes("API_KEY_INVALID")) {
                return "죄송해요, 아직 쑥쑥 선생님의 상담실 열쇠(API Key)가 꽂혀있지 않아요. 🗝️ 설정에서 키를 확인해주세요!";
            }

            return "잠시 상담실 연결이 불안정해요. ㅠㅠ 모델 설정을 다시 확인하고 곧 돌아올게요! 😭";
        }
    }

    // [New] 관찰 기록 문맥 분석
    async analyzeObservation(logText, currentAgeMonths, milestones) {
        const prompt = `
            당신은 세계 최고의 아동 발달 전문가입니다.
            부모님이 작성한 '관찰 기록'을 분석하여, 제공된 '표준 발달 데이터' 중 가장 부합하는 항목을 딱 하나만 찾아주세요.
            
            [부모님의 관찰 기록]: "${logText}"
            [아이 현재 월령]: ${currentAgeMonths}개월
            [표준 발달 데이터]: ${JSON.stringify(milestones)}
            
            ## 핵심 분석 지침 (매우 중요):
            1. **문장 구조 분석 우선**: 관찰 기록에서 아이가 '몇 단어를 조합해서 말했는지'를 가장 먼저 파악하세요.
               - 예: "엄마 물 주세요"는 3단어 조합 문장입니다. 이 경우 '엄마'나 '물'이라는 개별 단어가 아니라 '3단어 조합 문장 사용'이라는 언어 발달 지표에 매칭해야 합니다.
               - 예: "맘마"만 말했다면 1단어 발화(초기 언어)에 해당합니다.
            2. **키워드 함정 회피**: 관찰 기록에 '엄마'가 포함되어 있다고 해서 '엄마'라는 키워드를 가진 항목에 매칭하지 마세요. 문맥상 아이가 '문장을 말할 수 있다'는 것이 핵심이라면 언어 발달 조합 항목에 매칭하세요.
            3. **조기 발달 축하**: 아이의 현재 월령보다 높은 발달 항목에 매칭되어도 정확하다면 과감히 선택하고, 부모님께 아이의 빠른 성장을 축하해 주세요.
            4. **따뜻한 코멘트**: 매칭된 경우 부모님께 드리는 전문가다운 따뜻한 칭찬과 분석 코멘트를 한 문장으로 작성하세요.
            
            반드시 다음 JSON 형식으로만 답변하세요 (다른 텍스트 금지):
            {
                "isMatched": true,
                "matchedId": "항목 ID",
                "categoryId": "카테고리 ID(social/language/cognitive/physical 중 하나)",
                "matchedAge": 개월수(숫자),
                "matchedAgeLabel": "연령 라벨(예: 24개월)",
                "milestoneText": "발달 내용",
                "comment": "칭찬과 분석 코멘트"
            }
            매칭되는 항목이 절대 없다고 판단되면 {"isMatched": false}만 반환하세요.
        `;

        try {
            // 분석은 2.0 Flash 모델로 수행
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // JSON 부분만 정밀 추출
            const jsonMatch = text.match(/\{[\s\S]*\}/s);
            if (!jsonMatch) return { isMatched: false };

            const aiResult = JSON.parse(jsonMatch[0]);
            return aiResult;
        } catch (error) {
            console.error("AI Analysis Error:", error);
            return { isMatched: false };
        }
    }
}

export default new GeminiService();
