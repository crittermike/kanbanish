import React from 'react';

/**
 * Helper functions for the Kanban application
 */

/**
 * Generates a random ID string
 * @returns {string} A random ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Shows a notification message
 * @param {string} message The message to show
 */
export function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationMessage = document.getElementById('notification-message');

  if (notification && notificationMessage) {
    notificationMessage.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

/**
 * Curated list of well-supported emojis, grouped by category.
 */
export const COMMON_EMOJIS = [
  // Faces - smileys and emotion
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
  '🤔', '🫡', '🫠', '🫢', '🫣', '🫤', '🫥',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲',
  '😳', '🥺', '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
  '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
  '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺',
  '👻', '👽', '👾', '🤖',
  // Cat faces
  '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  // Monkey faces
  '🙈', '🙉', '🙊',

  // Hand gestures
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘',
  '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👋', '🤚',
  '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '🫶',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏',
  '✍️', '💅', '🤳', '💪', '🦾', '🦿',

  // Hearts and love
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',

  // Common symbols and objects
  '🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '💭',
  '👀', '🧠', '💡', '⚡', '✨', '⭐', '🌟',
  '✅', '❌', '❗', '❓', '⚠️', '🚫', '💰', '💎', '🎯', '🎪',
  '🏆', '🎉', '🎊', '🎈', '🚀', '🌈',
  '🔑', '🗝️', '🔒', '🔓', '🔔', '🔕',
  '📌', '📎', '🔗', '📝', '📋', '📁', '📂', '🗂️',
  '📅', '📆', '📊', '📈', '📉', '💻', '🖥️', '📱', '📧',

  // Animals
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
  '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛',
  '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟',
  '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀',
  '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🪸',
  '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪',
  '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
  '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈',
  '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝',
  '🦨', '🦡', '🦫', '🦦', '🦥',

  // Food and drinks
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
  '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
  '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠',
  '🍕', '🍔', '🍟', '🌭', '🍗', '🍖', '🥩', '🍳', '🥚', '🧀',
  '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙',
  '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦',
  '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍩', '🍪',
  '☕', '🍵', '🧋', '🥤', '🍺', '🍻', '🍷', '🥂', '🍾', '🍸',
  '🍹', '🧃', '🥛', '🫗',

  // Weather and nature
  '☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '🌩️', '🌨️',
  '❄️', '☃️', '⛄', '🌬️', '🌪️', '🌫️',
  '🌊', '💧', '☔', '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🪻',
  '🌿', '🍀', '🍁', '🍂', '🍃', '🌳', '🌲', '🌴', '🌵', '🪴',
  '🌱', '🪵', '🪨', '🍄', '🌾',
  '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗',
  '🌘', '🌙', '🌚', '🌛', '🌜',

  // Transportation
  '🚗', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻',
  '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺',
  '✈️', '🚁', '🛩️', '🛸',
  '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊',
  '🚝', '🚞', '🚟', '🚠', '🚡',
  '🛳️', '⛵', '🚤', '🛥️', '🚢', '⛴️',
  '🚦', '🚧', '⛽', '🛞',

  // Activities and sports
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
  '🏓', '🏸', '🥅', '⛳', '🏌️', '🏄', '🏊', '🤽', '🚣', '🧗',
  '🚴', '🚵', '🤸', '🤼', '🤾', '🏇', '⛷️', '🏂', '🏋️', '🤺',
  '🥊', '🥋', '🎮', '🎲', '🎸', '🎹', '🥁', '🎤', '🎧', '🎵',
  '🎶', '🎼', '🎬', '🎨', '🎭', '🎟️',

  // Christmas and holidays
  '🎄', '🎅', '🤶', '🎁', '🎀', '🛷', '🕯️',
  '🎃', '🎆', '🎇', '🧨', '🪔',

  // Zodiac
  '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
];

/**
 * Get keywords/descriptions for an emoji to enable search functionality
 * @param {string} emoji The emoji character
 * @returns {string[]} Array of keywords for the emoji
 */
export function getEmojiKeywords(emoji) {
  // Basic emoji keyword mapping for common emojis
  const emojiKeywords = {
    // Faces and emotions
    '😀': ['grinning', 'face', 'smile', 'happy', 'joy'],
    '😃': ['grinning', 'face', 'big', 'smile', 'happy', 'joy'],
    '😄': ['grinning', 'face', 'smile', 'happy', 'joy', 'laugh'],
    '😁': ['beaming', 'face', 'smile', 'happy', 'joy', 'laugh'],
    '😆': ['grinning', 'squinting', 'face', 'smile', 'happy', 'joy', 'laugh'],
    '😅': ['grinning', 'face', 'sweat', 'smile', 'happy', 'relief'],
    '🤣': ['rolling', 'floor', 'laughing', 'face', 'happy', 'joy', 'funny'],
    '😂': ['face', 'tears', 'joy', 'laugh', 'happy', 'cry'],
    '🙂': ['slightly', 'smiling', 'face', 'smile', 'happy'],
    '🙃': ['upside', 'down', 'face', 'smile', 'silly'],
    '😉': ['winking', 'face', 'smile', 'flirt'],
    '😊': ['smiling', 'face', 'eyes', 'smile', 'happy', 'blush'],
    '😇': ['smiling', 'face', 'halo', 'angel', 'innocent'],
    '🥰': ['smiling', 'face', 'hearts', 'love', 'adore'],
    '😍': ['smiling', 'face', 'heart', 'eyes', 'love', 'crush'],
    '🤩': ['star', 'struck', 'face', 'eyes', 'amazing'],
    '😘': ['face', 'blowing', 'kiss', 'love'],
    '😗': ['kissing', 'face', 'love'],
    '😚': ['kissing', 'face', 'closed', 'eyes', 'love'],
    '😙': ['kissing', 'face', 'smiling', 'eyes', 'love'],
    '😋': ['face', 'savoring', 'food', 'yum', 'delicious'],
    '😛': ['face', 'tongue', 'silly'],
    '😜': ['winking', 'face', 'tongue', 'silly'],
    '🤪': ['zany', 'face', 'silly', 'crazy'],
    '😝': ['squinting', 'face', 'tongue', 'silly'],
    '🤑': ['money', 'mouth', 'face', 'rich', 'dollar'],
    '🤗': ['hugging', 'face', 'hug', 'love'],
    '🤭': ['face', 'hand', 'mouth', 'quiet', 'secret'],
    '🤫': ['shushing', 'face', 'quiet', 'secret'],
    '🤔': ['thinking', 'face', 'hmm', 'consider'],
    '🤐': ['zipper', 'mouth', 'face', 'quiet', 'secret'],
    '🤨': ['face', 'raised', 'eyebrow', 'skeptical'],
    '😐': ['neutral', 'face', 'expressionless'],
    '😑': ['expressionless', 'face', 'blank'],
    '😶': ['face', 'without', 'mouth', 'quiet'],
    '😏': ['smirking', 'face', 'smug'],
    '😒': ['unamused', 'face', 'unhappy'],
    '🙄': ['face', 'rolling', 'eyes', 'annoyed'],
    '😬': ['grimacing', 'face', 'awkward'],
    '🤥': ['lying', 'face', 'pinocchio'],
    '😔': ['pensive', 'face', 'sad', 'sorry'],
    '😕': ['confused', 'face', 'worried'],
    '🙁': ['slightly', 'frowning', 'face', 'sad'],
    '☹️': ['frowning', 'face', 'sad'],
    '😣': ['persevering', 'face', 'struggle'],
    '😖': ['confounded', 'face', 'frustrated'],
    '😫': ['tired', 'face', 'exhausted'],
    '😩': ['weary', 'face', 'tired'],
    '🥺': ['pleading', 'face', 'puppy', 'eyes'],
    '😢': ['crying', 'face', 'tear', 'sad'],
    '😭': ['loudly', 'crying', 'face', 'sad', 'sob'],
    '😤': ['face', 'steam', 'nose', 'angry'],
    '😠': ['angry', 'face', 'mad'],
    '😡': ['pouting', 'face', 'angry', 'mad'],
    '🤬': ['face', 'symbols', 'mouth', 'swearing'],
    '🤯': ['exploding', 'head', 'mind', 'blown'],
    '😳': ['flushed', 'face', 'embarrassed'],
    '🥵': ['hot', 'face', 'heat', 'sweat'],
    '🥶': ['cold', 'face', 'freezing'],
    '😱': ['face', 'screaming', 'fear', 'shocked'],
    '😨': ['fearful', 'face', 'scared'],
    '😰': ['anxious', 'face', 'sweat', 'worried'],
    '😥': ['sad', 'relieved', 'face'],
    '😓': ['downcast', 'face', 'sweat', 'sad'],
    '😴': ['sleeping', 'face', 'sleep', 'tired'],
    '😪': ['sleepy', 'face', 'tired'],
    '😵': ['dizzy', 'face', 'confused'],
    '🥴': ['woozy', 'face', 'dizzy'],
    '🤢': ['nauseated', 'face', 'sick'],
    '🤮': ['face', 'vomiting', 'sick'],
    '🤧': ['sneezing', 'face', 'sick'],
    '😷': ['face', 'medical', 'mask', 'sick'],
    '🤒': ['face', 'thermometer', 'sick'],
    '🤕': ['face', 'head', 'bandage', 'hurt'],
    
    // Hearts and love
    '❤️': ['red', 'heart', 'love'],
    '🧡': ['orange', 'heart', 'love'],
    '💛': ['yellow', 'heart', 'love'],
    '💚': ['green', 'heart', 'love'],
    '💙': ['blue', 'heart', 'love'],
    '💜': ['purple', 'heart', 'love'],
    '🖤': ['black', 'heart', 'love'],
    '🤍': ['white', 'heart', 'love'],
    '🤎': ['brown', 'heart', 'love'],
    '💔': ['broken', 'heart', 'sad', 'breakup'],
    '❣️': ['heavy', 'heart', 'exclamation', 'love'],
    '💕': ['two', 'hearts', 'love'],
    '💞': ['revolving', 'hearts', 'love'],
    '💓': ['beating', 'heart', 'love'],
    '💗': ['growing', 'heart', 'love'],
    '💖': ['sparkling', 'heart', 'love'],
    '💘': ['heart', 'arrow', 'love', 'cupid'],
    '💝': ['heart', 'ribbon', 'gift', 'love'],
    '💟': ['heart', 'decoration', 'love'],
    
    // Hand gestures
    '👍': ['thumbs', 'up', 'good', 'yes', 'like'],
    '👎': ['thumbs', 'down', 'bad', 'no', 'dislike'],
    '👌': ['ok', 'hand', 'good', 'perfect'],
    '✌️': ['victory', 'hand', 'peace'],
    '🤞': ['crossed', 'fingers', 'luck', 'hope'],
    '🤟': ['love', 'you', 'gesture'],
    '🤘': ['sign', 'horns', 'rock'],
    '🤙': ['call', 'me', 'hand'],
    '👈': ['backhand', 'index', 'pointing', 'left'],
    '👉': ['backhand', 'index', 'pointing', 'right'],
    '👆': ['backhand', 'index', 'pointing', 'up'],
    '👇': ['backhand', 'index', 'pointing', 'down'],
    '☝️': ['index', 'pointing', 'up'],
    '✋': ['raised', 'hand', 'stop'],
    '🤚': ['raised', 'back', 'hand'],
    '🖐️': ['hand', 'fingers', 'splayed'],
    '🖖': ['vulcan', 'salute', 'spock'],
    '👋': ['waving', 'hand', 'hello', 'goodbye'],
    '🤝': ['handshake', 'deal', 'agreement'],
    '👏': ['clapping', 'hands', 'applause', 'good'],
    '🙌': ['raising', 'hands', 'celebration', 'praise'],
    '👐': ['open', 'hands', 'hug'],
    '🤲': ['palms', 'up', 'together'],
    '🙏': ['folded', 'hands', 'prayer', 'please', 'thanks'],
    
    // Common symbols and objects
    '🔥': ['fire', 'hot', 'burn', 'lit'],
    '💯': ['hundred', 'points', 'perfect', 'score'],
    '💪': ['flexed', 'biceps', 'strong', 'muscle'],
    '👀': ['eyes', 'looking', 'watching'],
    '🧠': ['brain', 'smart', 'think'],
    '💡': ['light', 'bulb', 'idea', 'bright'],
    '⚡': ['lightning', 'bolt', 'fast', 'power'],
    '✨': ['sparkles', 'stars', 'magic', 'clean'],
    '⭐': ['star', 'favorite', 'good'],
    '🏆': ['trophy', 'award', 'winner', 'champion'],
    '🎉': ['party', 'popper', 'celebration', 'confetti'],
    '🚀': ['rocket', 'space', 'fast', 'launch'],
    '🌈': ['rainbow', 'colorful', 'weather'],
    '✅': ['check', 'mark', 'button', 'done', 'complete'],
    '❌': ['cross', 'mark', 'x', 'wrong', 'no'],
    '❗': ['exclamation', 'mark', 'warning', 'important'],
    '❓': ['question', 'mark', 'confused', 'what'],
    '⚠️': ['warning', 'sign', 'caution', 'alert'],
    '💰': ['money', 'bag', 'dollar', 'rich'],
    '💎': ['gem', 'stone', 'diamond', 'precious'],
    '🎯': ['target', 'goal', 'aim', 'bullseye'],
    '🎪': ['circus', 'tent', 'entertainment'],
    
    // Animals
    '🐶': ['dog', 'face', 'pet', 'puppy'],
    '🐱': ['cat', 'face', 'pet', 'kitten'],
    '🐭': ['mouse', 'face', 'rodent'],
    '🐹': ['hamster', 'face', 'pet'],
    '🐰': ['rabbit', 'face', 'bunny'],
    '🦊': ['fox', 'face'],
    '🐻': ['bear', 'face'],
    '🐼': ['panda', 'face'],
    '🐨': ['koala', 'face'],
    '🐯': ['tiger', 'face'],
    '🦁': ['lion', 'face'],
    '🐸': ['frog', 'face'],
    '🐵': ['monkey', 'face'],
    
    // Food and drinks
    '🍎': ['apple', 'fruit', 'red'],
    '🍌': ['banana', 'fruit', 'yellow'],
    '🍇': ['grapes', 'fruit', 'purple'],
    '🍓': ['strawberry', 'fruit', 'red'],
    '🍊': ['orange', 'fruit'],
    '🍕': ['pizza', 'food', 'slice'],
    '🍔': ['hamburger', 'burger', 'food'],
    '🍟': ['french', 'fries', 'food'],
    '🌭': ['hot', 'dog', 'food'],
    '🍗': ['poultry', 'leg', 'chicken', 'food'],
    '🍖': ['meat', 'bone', 'food'],
    '🍳': ['cooking', 'egg', 'food'],
    '🍞': ['bread', 'food'],
    '🧀': ['cheese', 'wedge', 'food'],
    '🥗': ['green', 'salad', 'food'],
    '🍝': ['spaghetti', 'pasta', 'food'],
    '🍜': ['steaming', 'bowl', 'food', 'soup'],
    '🍲': ['pot', 'food', 'stew'],
    '🍰': ['shortcake', 'cake', 'dessert'],
    '🎂': ['birthday', 'cake', 'celebration'],
    '🍮': ['custard', 'dessert'],
    '🍭': ['lollipop', 'candy', 'sweet'],
    '🍬': ['candy', 'sweet'],
    '🍫': ['chocolate', 'bar', 'sweet'],
    '☕': ['coffee', 'drink', 'hot'],
    '🍵': ['tea', 'drink', 'hot'],
    '🥤': ['cup', 'straw', 'drink'],
    '🍺': ['beer', 'mug', 'drink', 'alcohol'],
    '🍻': ['clinking', 'beer', 'mugs', 'cheers'],
    '🍷': ['wine', 'glass', 'drink', 'alcohol'],
    
    // Weather and nature
    '☀️': ['sun', 'sunny', 'weather', 'bright'],
    '🌤️': ['sun', 'behind', 'small', 'cloud', 'weather'],
    '⛅': ['sun', 'behind', 'cloud', 'weather'],
    '☁️': ['cloud', 'weather'],
    '🌧️': ['cloud', 'rain', 'weather'],
    '⛈️': ['cloud', 'lightning', 'rain', 'weather'],
    '🌩️': ['cloud', 'lightning', 'weather'],
    '❄️': ['snowflake', 'snow', 'cold', 'winter'],
    '☃️': ['snowman', 'snow', 'winter'],
    '⛄': ['snowman', 'without', 'snow'],
    '🌊': ['water', 'wave', 'ocean', 'sea'],
    '💧': ['droplet', 'water', 'sweat'],
    '🌸': ['cherry', 'blossom', 'flower', 'spring'],
    '🌺': ['hibiscus', 'flower'],
    '🌻': ['sunflower', 'flower', 'yellow'],
    '🌹': ['rose', 'flower', 'red'],
    '🌷': ['tulip', 'flower'],
    '🌿': ['herb', 'leaf', 'green'],
    '🍀': ['four', 'leaf', 'clover', 'luck'],
    '🌳': ['deciduous', 'tree', 'nature'],
    '🌲': ['evergreen', 'tree', 'nature'],
    '🌵': ['cactus', 'desert', 'plant'],
    
    // Transportation
    '🚗': ['automobile', 'car', 'vehicle'],
    '🚙': ['sport', 'utility', 'vehicle', 'suv'],
    '🚌': ['bus', 'vehicle'],
    '🚎': ['trolleybus', 'vehicle'],
    '🏎️': ['racing', 'car', 'vehicle', 'fast'],
    '🚓': ['police', 'car', 'vehicle'],
    '🚑': ['ambulance', 'vehicle', 'emergency'],
    '🚒': ['fire', 'engine', 'vehicle'],
    '🚐': ['minibus', 'vehicle'],
    '🚚': ['delivery', 'truck', 'vehicle'],
    '🚛': ['articulated', 'lorry', 'truck'],
    '🚜': ['tractor', 'vehicle', 'farm'],
    '🏍️': ['motorcycle', 'vehicle'],
    '🛵': ['motor', 'scooter', 'vehicle'],
    '🚲': ['bicycle', 'bike', 'vehicle'],
    '🛴': ['kick', 'scooter', 'vehicle'],
    '✈️': ['airplane', 'plane', 'travel'],
    '🚁': ['helicopter', 'vehicle'],
    '🚂': ['locomotive', 'train', 'vehicle'],
    '🚃': ['railway', 'car', 'train'],
    '🚄': ['high', 'speed', 'train'],
    '🚅': ['bullet', 'train', 'fast'],
    '🚆': ['train', 'vehicle'],
    '🚇': ['metro', 'subway', 'train'],
    '🚈': ['light', 'rail', 'train'],
    '🚉': ['station', 'train'],
    '🚊': ['tram', 'vehicle'],
    '🚝': ['monorail', 'vehicle'],
    '🚞': ['mountain', 'railway', 'train'],
    '🚟': ['suspension', 'railway'],
    '🚠': ['mountain', 'cableway'],
    '🚡': ['aerial', 'tramway'],
    '🛳️': ['passenger', 'ship', 'boat'],
    '⛵': ['sailboat', 'boat', 'sail'],
    '🚤': ['speedboat', 'boat', 'fast'],
    '🛥️': ['motor', 'boat'],
    '🚢': ['ship', 'boat', 'large'],
    
    // Activities and sports
    '⚽': ['soccer', 'ball', 'football', 'sport'],
    '🏀': ['basketball', 'ball', 'sport'],
    '🏈': ['american', 'football', 'ball', 'sport'],
    '⚾': ['baseball', 'ball', 'sport'],
    '🥎': ['softball', 'ball', 'sport'],
    '🎾': ['tennis', 'ball', 'sport'],
    '🏐': ['volleyball', 'ball', 'sport'],
    '🏉': ['rugby', 'football', 'ball', 'sport'],
    '🥏': ['flying', 'disc', 'frisbee', 'sport'],
    '🎱': ['pool', '8', 'ball', 'billiards'],
    '🏓': ['ping', 'pong', 'table', 'tennis'],
    '🏸': ['badminton', 'sport'],
    '🥅': ['goal', 'net', 'sport'],
    '⛳': ['flag', 'hole', 'golf'],
    '🏌️': ['golfer', 'golf', 'sport'],
    '🏄': ['surfer', 'surfing', 'sport'],
    '🏊': ['swimmer', 'swimming', 'sport'],
    '🤽': ['water', 'polo', 'sport'],
    '🚣': ['rowing', 'boat', 'sport'],
    '🧗': ['climbing', 'sport'],
    '🚴': ['biking', 'cycling', 'sport'],
    '🚵': ['mountain', 'biking', 'sport'],
    '🤸': ['cartwheeling', 'gymnastics', 'sport'],
    '🤼': ['wrestling', 'sport'],
    '🤾': ['handball', 'sport'],
    '🏇': ['horse', 'racing', 'sport'],
    '⛷️': ['skier', 'skiing', 'sport'],
    '🏂': ['snowboarder', 'snowboarding', 'sport'],
    '🏋️': ['weight', 'lifter', 'gym', 'sport'],
    '🤺': ['fencing', 'sport'],
    '🥊': ['boxing', 'glove', 'sport'],
    '🥋': ['martial', 'arts', 'uniform', 'sport'],
    '🎮': ['video', 'game', 'controller', 'gaming'],
    '🎲': ['game', 'die', 'dice'],
    '🎸': ['guitar', 'music', 'instrument'],
    '🎹': ['musical', 'keyboard', 'piano'],
    '🥁': ['drum', 'music', 'instrument'],
    '🎤': ['microphone', 'sing', 'music'],
    '🎧': ['headphone', 'music', 'listen'],
    '🎵': ['musical', 'note', 'music'],
    '🎶': ['musical', 'notes', 'music'],
    '🎼': ['musical', 'score', 'music'],
    
    // Christmas emojis
    '🎄': ['christmas', 'tree', 'xmas', 'holiday', 'festive', 'pine', 'evergreen'],
    '🎅': ['santa', 'claus', 'christmas', 'xmas', 'holiday', 'festive', 'father'],
    '🤶': ['mrs', 'claus', 'christmas', 'xmas', 'holiday', 'festive', 'mother'],
    '🎁': ['gift', 'present', 'wrapped', 'christmas', 'xmas', 'holiday', 'birthday'],
    '🔔': ['bell', 'christmas', 'xmas', 'holiday', 'jingle', 'ring'],
    '🍪': ['cookie', 'christmas', 'xmas', 'gingerbread', 'dessert', 'sweet', 'biscuit'],
    '🎀': ['ribbon', 'bow', 'christmas', 'xmas', 'gift', 'present', 'decoration'],
    '🦌': ['deer', 'reindeer', 'christmas', 'xmas', 'rudolph', 'holiday', 'animal'],
    '🛷': ['sled', 'sleigh', 'christmas', 'xmas', 'winter', 'snow', 'holiday'],
    '🕯️': ['candle', 'light', 'christmas', 'xmas', 'holiday', 'festive', 'flame'],

    // Salute and related newer face/hand emojis
    '🫡': ['salute', 'saluting', 'face', 'respect', 'yes', 'sir', 'military', 'honor'],
    '🫠': ['melting', 'face', 'hot', 'disappear', 'embarrassed', 'sarcasm'],
    '🫢': ['face', 'open', 'eyes', 'hand', 'over', 'mouth', 'surprised', 'oops', 'gasp'],
    '🫣': ['face', 'peeking', 'eye', 'shy', 'nervous', 'scared', 'hiding'],
    '🫤': ['face', 'diagonal', 'mouth', 'skeptical', 'unsure', 'meh', 'disappointed'],
    '🫥': ['dotted', 'line', 'face', 'invisible', 'hidden', 'disappear', 'empty'],
    '🫶': ['heart', 'hands', 'love', 'gesture', 'appreciate', 'support', 'care'],
  };

  // Get keywords for the emoji, or try to extract from Unicode name
  const keywords = emojiKeywords[emoji] || [];
  
  // Add the emoji character itself as a keyword
  keywords.push(emoji);
  
  // Try to get Unicode name-based keywords
  try {
    const codePoint = emoji.codePointAt(0);
    if (codePoint) {
      // Generate some basic keywords based on Unicode ranges
      if (codePoint >= 0x1F600 && codePoint <= 0x1F64F) {
        keywords.push('face', 'emotion', 'smiley');
      } else if (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) {
        keywords.push('symbol', 'misc', 'object');
      } else if (codePoint >= 0x1F680 && codePoint <= 0x1F6FF) {
        keywords.push('transport', 'vehicle', 'map');
      } else if (codePoint >= 0x1F900 && codePoint <= 0x1F9FF) {
        keywords.push('supplemental', 'modern');
      }
    }
  } catch {
    // Ignore errors in Unicode processing
  }
  
  return keywords;
}

/**
 * Parse a boolean-like query param value.
 * Accepts: true/false/1/0/yes/no/on/off (case-insensitive)
 */
export function parseBool(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return undefined;
}

/**
 * Extracts supported settings from a query string for initial board creation and UI prefs.
 * Returns an object with boardSettings (persisted on new board) and uiPrefs (non-persisted).
 *
 * Supported query params:
 * - voting: boolean (enable voting)
 * - downvotes: boolean (allow downvoting)
 * - multivote: boolean (allow multiple votes per item)
 * - votes: number (votes per user)
 * - retro: boolean (retrospective mode on)
 * - sort: 'votes' | 'chrono' (UI preference)
 * - theme: 'dark' | 'light' (UI preference)
 */
export function parseUrlSettings(queryString) {
  try {
    const search = typeof queryString === 'string' ? queryString : '';
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);

  // Board settings (persisted on new board creation only)
  const boardSettings = {};

    const voting = parseBool(params.get('voting'));
    if (voting !== undefined) boardSettings.votingEnabled = voting;

    const downvotes = parseBool(params.get('downvotes'));
    if (downvotes !== undefined) boardSettings.downvotingEnabled = downvotes;

    const multivote = parseBool(params.get('multivote'));
    if (multivote !== undefined) boardSettings.multipleVotesAllowed = multivote;

    const votes = params.get('votes');
    if (votes != null && votes !== '') {
      const n = parseInt(votes, 10);
      if (!Number.isNaN(n) && n > 0 && n < 1000) boardSettings.votesPerUser = n;
    }

    const retro = parseBool(params.get('retro'));
    if (retro !== undefined) boardSettings.retrospectiveMode = retro;

    const sort = params.get('sort');
    if (typeof sort === 'string') {
      const s = sort.trim().toLowerCase();
      if (s === 'votes') boardSettings.sortByVotes = true;
      if (s === 'chrono' || s === 'chronological' || s === 'time') boardSettings.sortByVotes = false;
    }

    // UI-only preferences (not persisted as board settings)
    const uiPrefs = {};

    const theme = params.get('theme');
    if (typeof theme === 'string') {
      const t = theme.trim().toLowerCase();
      if (t === 'dark') uiPrefs.darkMode = true;
      if (t === 'light') uiPrefs.darkMode = false;
    }

  return { boardSettings, uiPrefs };
  } catch {
    return { boardSettings: {}, uiPrefs: {} };
  }
}

// URL regex for detecting HTTP/HTTPS URLs
const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&=/]*)/;

/**
 * Converts URLs in text to clickable links
 * @param {string} text The text that may contain URLs
 * @returns {React.ReactNode|React.ReactNode[]} Text with URLs converted to links
 */
export function linkifyText(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Check if text contains any URLs
  if (!URL_REGEX.test(text)) {
    return text;
  }

  // Split using global capturing regex
  const globalRegex = new RegExp(`(${URL_REGEX.source})`, 'g');
  const parts = text.split(globalRegex);
  
  // Filter out empty strings that can occur from split
  const filteredParts = parts.filter(part => part !== '');
  
  return filteredParts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      return React.createElement('a', {
        key: index,
        href: part,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'auto-link'
      }, part);
    }
    return part;
  });
}
