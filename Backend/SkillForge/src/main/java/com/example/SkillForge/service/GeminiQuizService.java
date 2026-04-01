// src/main/java/com/example/SkillForge/service/GeminiQuizService.java
package com.example.SkillForge.service;

import com.example.SkillForge.dto.QuestionDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GeminiQuizService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<QuestionDTO> generateQuestions(String topic, int numQuestions, String difficulty) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackQuestions(topic, numQuestions);
        }

        try {
            String systemInstruction = buildPrompt(topic, numQuestions, difficulty);

            // Direct JSON string for Gemini generateContent
            String bodyJson =
                    "{ \"contents\": [ { \"parts\": [ { \"text\": " +
                            objectMapper.writeValueAsString(systemInstruction) +
                            " } ] } ] }";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = apiUrl + "?key=" + apiKey.trim();

            HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            System.out.println("Gemini status = " + response.getStatusCode());
            System.out.println("Gemini body = " + response.getBody());

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return fallbackQuestions(topic, numQuestions);
            }

            List<QuestionDTO> questions = parseQuestionsFromResponse(response.getBody(), numQuestions);
            if (questions == null || questions.isEmpty()) {
                return fallbackQuestions(topic, numQuestions);
            }
            return questions;

        } catch (Exception e) {
            e.printStackTrace();
            return fallbackQuestions(topic, numQuestions);
        }
    }


    private String buildPrompt(String topic, int numQuestions, String difficulty) {
        String levelDesc =
                "BEGINNER".equalsIgnoreCase(difficulty) ? "beginner level"
                        : "INTERMEDIATE".equalsIgnoreCase(difficulty) ? "intermediate level"
                        : "ADVANCED".equalsIgnoreCase(difficulty) ? "advanced level"
                        : "appropriate difficulty";

        return String.format(
                "You are an exam question generator. " +
                        "Generate exactly %d multiple choice questions on the topic \"%s\" at %s. " +
                        "Return ONLY a JSON array (no extra text). Each item must be an object with fields: " +
                        "questionText (string), options (array of exactly 4 strings, like [\"A) ...\", \"B) ...\", ...]), " +
                        "correctAnswer (one of \"A\", \"B\", \"C\", \"D\"). " +
                        "Do not explain or add any other text outside the JSON array.",
                numQuestions, topic, levelDesc
        );
    }

    private List<QuestionDTO> parseQuestionsFromResponse(String body, int numRequested) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                return List.of();
            }

            JsonNode content = candidates.get(0).path("content");
            JsonNode parts = content.path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                return List.of();
            }

            String text = parts.get(0).path("text").asText().trim();

            // Extract JSON array substring between first '[' and last ']'
            String json = text;
            int start = json.indexOf('[');
            int end = json.lastIndexOf(']') + 1;
            if (start >= 0 && end > start) {
                json = json.substring(start, end);
            }

            JsonNode arr = objectMapper.readTree(json);
            if (!arr.isArray()) {
                return List.of();
            }

            List<QuestionDTO> result = new ArrayList<>();
            for (JsonNode node : arr) {
                String questionText = node.path("questionText").asText(null);
                JsonNode optionsNode = node.path("options");
                String correctAnswer = node.path("correctAnswer").asText("A");

                if (questionText == null || !optionsNode.isArray() || optionsNode.size() < 4) {
                    continue;
                }

                List<String> options = new ArrayList<>();
                for (JsonNode opt : optionsNode) {
                    options.add(opt.asText());
                }

                QuestionDTO dto = QuestionDTO.builder()
                        .questionText(questionText)
                        .options(options)
                        .correctAnswer(normalizeCorrectAnswer(correctAnswer))
                        .questionType("MCQ")
                        .build();
                result.add(dto);
            }

            if (result.isEmpty()) {
                return List.of();
            }
            return result.size() > numRequested ? result.subList(0, numRequested) : result;

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    private String normalizeCorrectAnswer(String correct) {
        if (correct == null) return "A";
        String trimmed = correct.trim().toUpperCase();
        if (trimmed.length() == 1 && trimmed.charAt(0) >= 'A' && trimmed.charAt(0) <= 'D') {
            return trimmed;
        }
        if (trimmed.length() > 1 && trimmed.charAt(1) == ')') {
            char c = trimmed.charAt(0);
            if (c >= 'A' && c <= 'D') {
                return String.valueOf(c);
            }
        }
        return "A";
    }

    private List<QuestionDTO> fallbackQuestions(String topic, int numQuestions) {
        int n = numQuestions > 0 ? numQuestions : 5;
        List<QuestionDTO> list = new ArrayList<>();
        for (int i = 1; i <= n; i++) {
            List<String> options = List.of(
                    "A) Basic concept of " + topic,
                    "B) Detail about " + topic,
                    "C) Common misconception about " + topic,
                    "D) Advanced concept of " + topic
            );
            String letter = switch (i % 4) {
                case 1 -> "A";
                case 2 -> "B";
                case 3 -> "C";
                default -> "D";
            };
            QuestionDTO q = QuestionDTO.builder()
                    .questionText("Sample question " + i + " about " + topic + "?")
                    .options(options)
                    .correctAnswer(letter)
                    .questionType("MCQ")
                    .build();
            list.add(q);
        }
        return list;
    }
}
