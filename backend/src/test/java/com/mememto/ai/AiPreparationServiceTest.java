package com.mememto.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class AiPreparationServiceTest {

    /** Faux fournisseur : renvoie une réponse prévue et retient ce qu'on lui a envoyé. */
    static class FakeClient implements LlmClient {
        final String reply;
        String receivedKey;
        String receivedUser;

        FakeClient(String reply) {
            this.reply = reply;
        }

        @Override
        public AiProvider provider() {
            return AiProvider.ANTHROPIC;
        }

        @Override
        public String complete(String apiKey, String system, String user) {
            receivedKey = apiKey;
            receivedUser = user;
            return reply;
        }
    }

    private static AiPreparationService service(FakeClient client) {
        return new AiPreparationService(List.of(client), JsonMapper.builder().build());
    }

    private static final String TEXT = "La Bastille est prise le 14 juillet 1789. Louis XVI est guillotiné en 1793.";

    @Test
    void keepsValidItemsAndSendsTheKeyAndTheLessonToTheProvider() {
        FakeClient client = new FakeClient("""
            {"items":[{"sentence":"La Bastille est prise le 14 juillet 1789.","answer":"14 juillet 1789",
              "distractors":["4 août 1789","20 juin 1789","9 juillet 1789"],"keywords":["Bastille","14 juillet 1789"]}]}""");

        List<PreparedItem> items = service(client).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT);

        assertEquals(1, items.size());
        assertEquals("14 juillet 1789", items.get(0).answer());
        assertEquals(3, items.get(0).distractors().size());
        assertEquals("sk-ma-cle-secrete", client.receivedKey);
        assertTrue(client.receivedUser.contains(TEXT));
    }

    @Test
    void toleratesTextAroundTheJsonAndUnknownFields() {
        FakeClient client = new FakeClient("Voici le résultat :\n```json\n"
            + "{\"items\":[{\"sentence\":\"Louis XVI est guillotiné en 1793.\",\"answer\":\"1793\","
            + "\"distractors\":[\"1789\",\"1791\",\"1795\"],\"keywords\":[\"1793\"],\"note\":\"inutile\"}]}\n```");

        assertEquals(1, service(client).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT).size());
    }

    @Test
    void dropsItemsWhoseAnswerIsNotInTheSentence() {
        FakeClient client = new FakeClient("""
            {"items":[
              {"sentence":"Louis XVI est guillotiné en 1793.","answer":"1799","distractors":["a","b","c"],"keywords":[]},
              {"sentence":"Louis XVI est guillotiné en 1793.","answer":"1793","distractors":["1789","1791","1795"],"keywords":[]}]}""");

        List<PreparedItem> items = service(client).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT);

        assertEquals(1, items.size());
        assertEquals(List.of("1793"), items.get(0).keywords(), "sans mot clé, la réponse en tient lieu");
    }

    @Test
    void withoutThreeDistinctWrongChoicesTheItemFallsBackToFreeAnswer() {
        FakeClient client = new FakeClient("""
            {"items":[{"sentence":"Louis XVI est guillotiné en 1793.","answer":"1793",
              "distractors":["1793","1789","1789"],"keywords":["1793"]}]}""");

        PreparedItem item = service(client).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT).get(0);

        assertTrue(item.distractors().isEmpty());
    }

    @Test
    void anUnusableAnswerBecomesAProviderError() {
        assertThrows(AiUnavailableException.class,
            () -> service(new FakeClient("désolé, je ne peux pas")).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT));
        assertThrows(AiUnavailableException.class,
            () -> service(new FakeClient("{\"items\":[]}")).prepare(AiProvider.ANTHROPIC, "sk-ma-cle-secrete", TEXT));
    }
}
