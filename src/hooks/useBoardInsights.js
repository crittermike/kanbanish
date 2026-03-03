import { useMemo } from 'react';

/**
 * Common English stop words to filter out during word frequency analysis.
 * These words carry little semantic meaning and would skew theme extraction.
 */
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
  'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get',
  'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
  'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
  'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has',
  'had', 'did', 'does', 'am', 'were', 'being', 'more', 'very',
  'much', 'too', 'should', 'need', 'lot', 'really', 'thing', 'things',
  'still', 'many', 'don', 'doesn', 'didn', 'wasn', 'weren', 'isn',
  'aren', 'haven', 'hasn', 'hadn', 'won', 'wouldn', 'couldn',
  'shouldn', 'let', 'got', 'getting', 'going', 'went', 'made'
]);

/**
 * Positive sentiment indicators — words that suggest positive feedback.
 */
const POSITIVE_WORDS = new Set([
  'great', 'awesome', 'excellent', 'love', 'amazing', 'fantastic',
  'wonderful', 'happy', 'improved', 'improvement', 'better', 'best',
  'success', 'successful', 'helpful', 'helped', 'nice', 'perfect',
  'smooth', 'efficient', 'effective', 'productive', 'progress',
  'achieved', 'achievement', 'positive', 'enjoyed', 'enjoy',
  'celebrate', 'proud', 'glad', 'pleased', 'thanks', 'thank',
  'appreciate', 'appreciated', 'kudos', 'bravo', 'win', 'won',
  'strong', 'reliable', 'stable', 'fast', 'quick', 'clear',
  'collaborative', 'teamwork', 'supported', 'support'
]);

/**
 * Negative sentiment indicators — words that suggest concerns or issues.
 */
const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'hate', 'frustrating', 'frustrated',
  'slow', 'broken', 'bug', 'bugs', 'issue', 'issues', 'problem',
  'problems', 'difficult', 'hard', 'confusing', 'confused', 'unclear',
  'worse', 'worst', 'fail', 'failed', 'failure', 'lacking', 'lack',
  'missing', 'delayed', 'delay', 'blocker', 'blocked', 'stuck',
  'painful', 'pain', 'stress', 'stressful', 'overwhelming',
  'overwhelmed', 'messy', 'chaos', 'chaotic', 'unstable', 'unreliable',
  'complex', 'complicated', 'struggling', 'struggle', 'concern',
  'concerned', 'worried', 'risk', 'risky', 'disappointing',
  'disappointed', 'annoying', 'annoyed', 'tedious', 'boring',
  'disconnect', 'disconnected', 'siloed', 'technical debt'
]);

/**
 * Tokenize text into lowercase words, filtering out stop words and short tokens.
 * @param {string} text - Raw text content
 * @returns {string[]} Array of meaningful words
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Extract bigrams (two-word phrases) from a token array.
 * @param {string[]} tokens - Array of tokens
 * @returns {string[]} Array of bigram strings
 */
function extractBigrams(tokens) {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Count word frequencies from an array of token arrays.
 * @param {string[][]} tokenArrays - Array of token arrays (one per card)
 * @returns {Map<string, number>} Word frequency map
 */
function countFrequencies(tokenArrays) {
  const freq = new Map();
  tokenArrays.forEach(tokens => {
    // Use Set per card to count document frequency (not total frequency)
    const seen = new Set();
    tokens.forEach(token => {
      if (!seen.has(token)) {
        freq.set(token, (freq.get(token) || 0) + 1);
        seen.add(token);
      }
    });
  });
  return freq;
}

/**
 * Analyze sentiment from tokens.
 * @param {string[]} tokens - Array of tokens
 * @returns {{ positive: number, negative: number, neutral: number }}
 */
function analyzeSentiment(tokens) {
  let positive = 0;
  let negative = 0;

  tokens.forEach(token => {
    if (POSITIVE_WORDS.has(token)) positive++;
    if (NEGATIVE_WORDS.has(token)) negative++;
  });

  const total = positive + negative;
  if (total === 0) return { positive: 0, negative: 0, neutral: 1 };

  return {
    positive: positive / total,
    negative: negative / total,
    neutral: 0
  };
}

/**
 * Generate a natural language summary sentence.
 * @param {Object} stats - Board statistics
 * @param {Array} themes - Top themes
 * @param {Object} sentiment - Sentiment analysis result
 * @returns {string} Human-readable summary
 */
function generateSummary(stats, themes, sentiment) {
  const parts = [];

  // Opening with board size
  if (stats.totalCards === 0) {
    return 'This board is empty. Add some cards to see insights.';
  }

  const cardWord = stats.totalCards === 1 ? 'card' : 'cards';
  const colWord = stats.totalColumns === 1 ? 'column' : 'columns';
  parts.push(`This board has ${stats.totalCards} ${cardWord} across ${stats.totalColumns} ${colWord}`);

  // Participation
  if (stats.totalVotes > 0) {
    parts.push(`with ${stats.totalVotes} total votes cast`);
  }

  // Engagement
  if (stats.totalComments > 0) {
    const commentWord = stats.totalComments === 1 ? 'comment' : 'comments';
    parts.push(`and ${stats.totalComments} ${commentWord}`);
  }

  let summary = parts.join(' ') + '.';

  // Top themes
  if (themes.length > 0) {
    const topThemes = themes.slice(0, 3).map(t => `"${t.word}"`);
    if (topThemes.length === 1) {
      summary += ` The dominant theme is ${topThemes[0]}.`;
    } else {
      const last = topThemes.pop();
      summary += ` Key themes include ${topThemes.join(', ')} and ${last}.`;
    }
  }

  // Sentiment overview
  if (sentiment.overall !== 'neutral') {
    const sentimentLabel = sentiment.overall === 'positive'
      ? 'Overall sentiment is positive'
      : 'Overall sentiment leans negative';
    summary += ` ${sentimentLabel} (${Math.round(sentiment.score * 100)}% ${sentiment.overall}).`;
  }

  return summary;
}

/**
 * Hook that computes board analytics and insights from current board data.
 * All computation is client-side — no external API calls needed.
 *
 * @param {Object} params
 * @param {Object} params.columns - Board columns from context
 * @param {Object} params.actionItems - Action items from context
 * @param {number} params.activeUsers - Active user count
 * @returns {Object} Computed insights
 */
export const useBoardInsights = ({ columns, actionItems, activeUsers }) => {
  return useMemo(() => {
    const columnEntries = Object.entries(columns || {}).sort((a, b) => a[0].localeCompare(b[0]));

    // ── Basic Statistics ──────────────────────────────────────────────
    let totalCards = 0;
    let totalVotes = 0;
    let totalComments = 0;
    let totalReactions = 0;
    let totalGroups = 0;
    const allCards = [];
    const allGroups = [];
    const columnStats = [];

    columnEntries.forEach(([columnId, column]) => {
      if (!column) return;

      const cards = Object.entries(column.cards || {});
      const groups = Object.entries(column.groups || {});
      let colVotes = 0;
      let colComments = 0;
      let colReactions = 0;

      cards.forEach(([cardId, card]) => {
        totalCards++;
        const votes = card.votes || 0;
        totalVotes += votes;
        colVotes += votes;

        const commentCount = Object.keys(card.comments || {}).length;
        totalComments += commentCount;
        colComments += commentCount;

        const reactionCount = Object.values(card.reactions || {}).reduce(
          (sum, r) => sum + (r?.count || 0), 0
        );
        totalReactions += reactionCount;
        colReactions += reactionCount;

        allCards.push({
          id: cardId,
          columnId,
          columnTitle: column.title || 'Untitled',
          content: card.content || '',
          votes,
          commentCount,
          reactionCount,
          tags: card.tags || [],
          groupId: card.groupId || null,
          createdBy: card.createdBy || null
        });
      });

      groups.forEach(([groupId, group]) => {
        if (!group) return;
        totalGroups++;
        const groupVotes = group.votes || 0;
        totalVotes += groupVotes;
        colVotes += groupVotes;

        allGroups.push({
          id: groupId,
          columnId,
          columnTitle: column.title || 'Untitled',
          name: group.name || 'Unnamed Group',
          votes: groupVotes,
          cardCount: (group.cardIds || []).length
        });
      });

      columnStats.push({
        id: columnId,
        title: column.title || 'Untitled',
        cardCount: cards.length,
        groupCount: groups.length,
        votes: colVotes,
        comments: colComments,
        reactions: colReactions
      });
    });

    const stats = {
      totalCards,
      totalColumns: columnEntries.length,
      totalVotes,
      totalComments,
      totalReactions,
      totalGroups,
      activeUsers: activeUsers || 0,
      uniqueAuthors: new Set(allCards.map(c => c.createdBy).filter(Boolean)).size,
      avgVotesPerCard: totalCards > 0 ? Math.round((totalVotes / totalCards) * 10) / 10 : 0,
      avgCommentsPerCard: totalCards > 0 ? Math.round((totalComments / totalCards) * 10) / 10 : 0
    };

    // ── Column Distribution ───────────────────────────────────────────
    const columnDistribution = columnStats.map(col => ({
      ...col,
      percentage: totalCards > 0 ? Math.round((col.cardCount / totalCards) * 100) : 0
    }));

    // ── Theme Extraction ──────────────────────────────────────────────
    const tokenArrays = allCards.map(card => tokenize(card.content));
    const wordFreq = countFrequencies(tokenArrays);

    // Also extract bigrams for phrase-level themes
    const bigramArrays = tokenArrays.map(extractBigrams);
    const bigramFreq = countFrequencies(bigramArrays);

    // Combine single words and bigrams, favoring bigrams with higher counts
    const themes = [];
    const usedInBigrams = new Set();

    // Add bigrams that appear in 2+ cards
    [...bigramFreq.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([bigram, count]) => {
        themes.push({ word: bigram, count, type: 'phrase' });
        bigram.split(' ').forEach(w => usedInBigrams.add(w));
      });

    // Add single words that appear in 2+ cards and aren't already in a bigram
    [...wordFreq.entries()]
      .filter(([word, count]) => count >= 2 && !usedInBigrams.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10 - themes.length)
      .forEach(([word, count]) => {
        themes.push({ word, count, type: 'word' });
      });

    themes.sort((a, b) => b.count - a.count);

    // ── Tag Analysis ──────────────────────────────────────────────────
    const tagCounts = new Map();
    allCards.forEach(card => {
      (card.tags || []).forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const tagDistribution = [...tagCounts.entries()]
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalCards > 0 ? Math.round((count / totalCards) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // ── Sentiment Analysis ────────────────────────────────────────────
    const allTokens = tokenArrays.flat();
    const sentimentResult = analyzeSentiment(allTokens);

    // Per-column sentiment
    const columnSentiment = columnStats.map((col) => {
      const colCards = allCards.filter(c => c.columnId === col.id);
      const colTokens = colCards.flatMap(c => tokenize(c.content));
      const colSentiment = analyzeSentiment(colTokens);
      return {
        ...col,
        sentiment: colSentiment
      };
    });

    const sentiment = {
      positive: sentimentResult.positive,
      negative: sentimentResult.negative,
      overall: sentimentResult.positive > sentimentResult.negative + 0.1
        ? 'positive'
        : sentimentResult.negative > sentimentResult.positive + 0.1
          ? 'negative'
          : 'neutral',
      score: Math.max(sentimentResult.positive, sentimentResult.negative),
      byColumn: columnSentiment
    };

    // ── Top Items ─────────────────────────────────────────────────────
    const topVotedCards = [...allCards]
      .filter(c => c.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);

    const topVotedGroups = [...allGroups]
      .filter(g => g.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);

    const mostDiscussed = [...allCards]
      .filter(c => c.commentCount > 0)
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 5);

    const mostReacted = [...allCards]
      .filter(c => c.reactionCount > 0)
      .sort((a, b) => b.reactionCount - a.reactionCount)
      .slice(0, 5);

    // ── Action Items Summary ──────────────────────────────────────────
    const actionItemsList = Object.values(actionItems || {});
    const openActionItems = actionItemsList.filter(i => i.status === 'open');
    const doneActionItems = actionItemsList.filter(i => i.status === 'done');

    const today = new Date().toDateString();
    const overdueItems = openActionItems.filter(
      i => i.dueDate && new Date(i.dueDate) < new Date(today)
    );

    const actionItemsSummary = {
      total: actionItemsList.length,
      open: openActionItems.length,
      done: doneActionItems.length,
      overdue: overdueItems.length,
      completionRate: actionItemsList.length > 0
        ? Math.round((doneActionItems.length / actionItemsList.length) * 100)
        : 0
    };

    // ── Engagement Score ──────────────────────────────────────────────
    // Composite score 0-100 based on votes, comments, reactions, groups
    const engagementFactors = {
      votingActivity: totalCards > 0 ? Math.min(totalVotes / totalCards / 3, 1) : 0,
      commentActivity: totalCards > 0 ? Math.min(totalComments / totalCards / 2, 1) : 0,
      reactionActivity: totalCards > 0 ? Math.min(totalReactions / totalCards / 2, 1) : 0,
      groupingActivity: totalCards > 0 ? Math.min(totalGroups / Math.ceil(totalCards / 3), 1) : 0
    };

    const engagementScore = Math.round(
      (
        engagementFactors.votingActivity * 0.4 +
        engagementFactors.commentActivity * 0.3 +
        engagementFactors.reactionActivity * 0.15 +
        engagementFactors.groupingActivity * 0.15
      ) * 100
    );

    // ── Natural Language Summary ──────────────────────────────────────
    const summary = generateSummary(stats, themes, sentiment);

    return {
      stats,
      columnDistribution,
      themes,
      tagDistribution,
      sentiment,
      topVotedCards,
      topVotedGroups,
      mostDiscussed,
      mostReacted,
      actionItemsSummary,
      engagementScore,
      engagementFactors,
      summary,
      isEmpty: totalCards === 0
    };
  }, [columns, actionItems, activeUsers]);
};
