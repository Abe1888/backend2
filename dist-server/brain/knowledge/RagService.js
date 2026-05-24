import fs from 'fs';
import path from 'path';
export class RagService {
    snippets = [];
    indexedAt = 0;
    constructor() {
        this.rebuildIndex();
    }
    async retrieveContext(query) {
        const snippets = await this.retrieveSnippets(query, 4);
        if (snippets.length === 0)
            return "TRANSLINK KNOWLEDGE: No specific matching snippet found.";
        return [
            "TRANSLINK RETRIEVED KNOWLEDGE:",
            ...snippets.map((snippet, index) => {
                return `[${index + 1}] ${snippet.metadata.source} (score ${snippet.score.toFixed(2)}):\n${snippet.text}`;
            }),
        ].join("\n\n");
    }
    async retrieveSnippets(query, limit = 4) {
        if (this.snippets.length === 0)
            this.rebuildIndex();
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0)
            return [];
        const scored = this.snippets
            .map((snippet) => ({
            ...snippet,
            score: this.scoreSnippet(queryTokens, snippet.text),
        }))
            .filter((snippet) => snippet.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return scored;
    }
    async indexDocument(docId, content) {
        const chunks = this.chunkText(content);
        const newSnippets = chunks.map((text, index) => ({
            id: `${docId}:${index}`,
            text,
            score: 0,
            metadata: {
                source: docId,
                chunkIndex: index,
            },
        }));
        this.snippets = [
            ...this.snippets.filter((snippet) => snippet.metadata.source !== docId),
            ...newSnippets,
        ];
        this.indexedAt = Date.now();
        console.log(`[RAG] Indexed ${newSnippets.length} chunks from ${docId}`);
    }
    getStats() {
        return {
            snippets: this.snippets.length,
            indexedAt: this.indexedAt,
        };
    }
    rebuildIndex() {
        const configDir = path.resolve(process.cwd(), 'src/translinkconfig/live-voice');
        const snippets = [];
        try {
            if (!fs.existsSync(configDir)) {
                this.snippets = [];
                return;
            }
            const files = fs
                .readdirSync(configDir)
                .filter((file) => file.endsWith('.md') || file.endsWith('.txt'));
            for (const file of files) {
                const filePath = path.join(configDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                this.chunkText(content).forEach((text, chunkIndex) => {
                    snippets.push({
                        id: `${file}:${chunkIndex}`,
                        text,
                        score: 0,
                        metadata: {
                            source: file,
                            chunkIndex,
                        },
                    });
                });
            }
            this.snippets = snippets;
            this.indexedAt = Date.now();
            console.log(`[RAG] Built local retrieval index with ${snippets.length} chunks.`);
        }
        catch (error) {
            console.error('[RAG] Failed to rebuild local knowledge index:', error);
            this.snippets = [];
        }
    }
    chunkText(content) {
        const normalized = content
            .replace(/\r\n/g, '\n')
            .split(/\n{2,}/)
            .map((part) => part.trim())
            .filter(Boolean);
        const chunks = [];
        let current = "";
        const maxChars = 1200;
        for (const part of normalized) {
            if ((current + "\n\n" + part).length > maxChars && current) {
                chunks.push(current);
                current = part;
            }
            else {
                current = current ? `${current}\n\n${part}` : part;
            }
        }
        if (current)
            chunks.push(current);
        return chunks;
    }
    scoreSnippet(queryTokens, text) {
        const textTokens = this.tokenize(text);
        if (textTokens.length === 0)
            return 0;
        const frequencies = new Map();
        textTokens.forEach((token) => frequencies.set(token, (frequencies.get(token) || 0) + 1));
        let score = 0;
        const uniqueQueryTokens = Array.from(new Set(queryTokens));
        uniqueQueryTokens.forEach((token) => {
            const frequency = frequencies.get(token) || 0;
            if (frequency > 0)
                score += 1 + Math.log(1 + frequency);
        });
        return score / Math.sqrt(textTokens.length / 80);
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2 && !this.stopWords.has(token));
    }
    stopWords = new Set([
        'the',
        'and',
        'for',
        'with',
        'that',
        'this',
        'from',
        'are',
        'you',
        'your',
        'our',
        'into',
        'can',
        'will',
        'about',
    ]);
}
export const ragService = new RagService();
