var prio = [
    {
        192: "cool",
        10: "nice",
        176: "fat",
    },
    {
        168: "party",
        16: "ball",
        0: "thing",
    },
    {
        0: "mom",
    },
    {}
];

var adjectiveWords = ["bad", "ill", "odd", "shy", "old", "big", "low", "new", "blue", "busy", "calm", "cute", "dark", "dead", "drab", "dull", "easy", "evil", "fair", "fine", "good", "hurt", "kind", "lazy", "long", "open", "poor", "real", "rich", "sore", "tame", "ugly", "vast", "wild", "zany", "able", "best", "free", "full", "hard", "short", "high", "late", "only", "sure", "true", "alert", "alive", "angry", "awful", "black", "bored", "brave", "clean", "clear", "crazy", "cruel", "dizzy", "eager", "fancy", "frail", "funny", "happy", "itchy", "jolly", "light", "lucky", "misty", "muddy", "mushy", "nasty", "nutty", "plain", "proud", "scary", "shiny", "silly", "super", "tasty", "tense", "tired", "tough", "upset", "weary", "witty", "wrong", "early", "great", "human", "large", "local", "major", "other", "right", "small", "white", "whole", "young", "amused", "better", "bloody", "brainy", "bright", "clever", "cloudy", "clumsy", "creepy", "elated", "famous", "fierce", "filthy", "gentle", "gifted", "grumpy", "homely", "hungry", "joyous", "lively", "lonely", "lovely", "modern", "poised", "putrid", "quaint", "sleepy", "smoggy", "stormy", "stupid", "tender", "wicked", "little", "public", "recent", "social", "strong", "annoyed", "anxious", "ashamed", "average", "careful", "crowded", "curious", "defiant", "elegant", "envious", "excited", "foolish", "fragile", "frantic", "healthy", "helpful", "jealous", "jittery", "naughty", "nervous", "panicky", "perfect", "prickly", "puzzled", "selfish", "smiling", "strange", "ugliest", "unusual", "uptight", "worried", "certain", "federal", "special", "adorable", "annoying", "arrogant", "blushing", "cautious", "charming", "cheerful", "colorful", "confused", "defeated", "distinct", "doubtful", "faithful", "friendly", "gleaming", "glorious", "gorgeous", "graceful", "grieving", "handsome", "helpless", "homeless", "horrible", "innocent", "obedient", "pleasant", "powerful", "precious", "relieved", "splendid", "spotless", "talented", "terrible", "thankful", "troubled", "zealous\n", "economic", "military", "national", "possible", "agreeable", "beautiful", "breakable", "combative", "concerned", "condemned", "dangerous", "depressed", "different", "difficult", "disgusted", "disturbed", "energetic", "expensive", "exuberant", "fantastic", "glamorous", "grotesque", "hilarious", "important", "obnoxious", "repulsive", "sparkling", "unsightly", "vivacious", "wandering", "worrisome", "political", "aggressive", "attractive", "bewildered", "courageous", "delightful", "determined", "enchanting", "frightened", "impossible", "motionless", "mysterious", "outrageous", "successful", "thoughtful", "victorious", "adventurous", "comfortable", "cooperative", "embarrassed"];
var nounWords = ["act", "air", "art", "bit", "cry", "day", "end", "ice", "ink", "law", "oil", "man", "back", "base", "bite", "blow", "body", "burn", "care", "coal", "cook", "copy", "cork", "debt", "dust", "edge", "fact", "fall", "fear", "fire", "fold", "food", "form", "gold", "grip", "hate", "heat", "help", "hole", "hope", "hour", "idea", "iron", "join", "jump", "kick", "kiss", "land", "lead", "lift", "list", "look", "loss", "love", "mark", "mass", "meal", "meat", "milk", "mind", "mine", "mist", "move", "name", "need", "news", "note", "page", "pain", "part", "play", "birth", "blood", "brass", "bread", "burst", "cause", "chalk", "cloth", "color", "cough", "cover", "crack", "crime", "crush", "curve", "death", "doubt", "drink", "earth", "error", "event", "field", "fight", "flame", "force", "front", "fruit", "glass", "grain", "grass", "group", "guide", "humor", "jelly", "judge", "laugh", "level", "light", "limit", "linen", "metal", "money", "month", "music", "night", "noise", "offer", "order", "owner", "paint", "paper", "paste", "peace", "place", "plant", "point", "power", "price", "print", "amount", "animal", "answer", "attack", "belief", "breath", "butter", "canvas", "chance", "change", "copper", "cotton", "credit", "damage", "danger", "degree", "design", "desire", "detail", "effect", "expert", "family", "father", "flight", "flower", "friend", "growth", "harbor", "insect", "letter", "liquid", "market", "memory", "middle", "minute", "mother", "motion", "nation", "number", "person", "poison", "polish", "porter", "powder", "account", "attempt", "balance", "brother", "comfort", "company", "control", "country", "current", "disease", "disgust", "driving", "example", "feeling", "fiction", "harmony", "hearing", "history", "impulse", "journey", "leather", "machine", "manager", "measure", "meeting", "morning", "opinion", "payment", "process", "produce", "addition", "approval", "argument", "behavior", "building", "business", "daughter", "decision", "distance", "division", "exchange", "increase", "industry", "interest", "language", "learning", "mountain", "ornament", "pleasure", "position", "agreement", "amusement", "apparatus", "attention", "authority", "committee", "condition", "digestion", "direction", "discovery", "education", "existence", "expansion", "insurance", "invention", "knowledge", "operation", "adjustment", "attraction", "comparison", "connection", "discussion", "experience", "government", "instrument", "competition", "destruction", "development", "observation", "distribution", "organisation", "advertisement"];

// adjective, noun, noun, noun

function getCode(ip) {
    var a = ip.split(".").map(e => parseInt(e));
    return a.map((e, i) => {
        if (prio[i][e]) {
            return prio[i][e];
        }
        if (i == 0) {
            return adjectiveWords[e];
        }
        return nounWords[e];
    }).join(" ");
}

function getIP(code) {
    var a = code.trim().split(/\s+/).map(e => e.toLowerCase());
    var invalid = false;
    a = a.map((e, i) => {
        for (var p in prio[i]) {
            if (prio[i][p] == e) {
                return p;
            }
        }
        var n;
        if (i == 0) {
            n = adjectiveWords.indexOf(e);
        } else {
            n = nounWords.indexOf(e);
        }
        invalid = invalid || n == -1;
        return n;
    });
    if (invalid) {
        return null;
    }
    return a.join(".");
}

export default {
    getCode: getCode,
    getIP: getIP,
};