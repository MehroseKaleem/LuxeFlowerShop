export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
  /** Full article body, one entry per paragraph or subheading. */
  content: { heading?: string; text: string }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'red-roses-symbol-of-love',
    title: 'Why Red Roses Remain the Ultimate Symbol of Love',
    category: 'Bloom',
    date: 'August 5, 2026',
    excerpt:
      'From grand anniversaries to quiet everyday gestures, discover why a hand-tied red rose bouquet still says "I love you" better than anything else — and how to keep one fresh for longer.',
    image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589221/luxeflower/products/pvnfairvnobfaslglocp.jpg',
    content: [
      {
        text: "Long before emojis and text messages, people reached for red roses to say the one thing that's hardest to put into words. That tradition hasn't faded — if anything, a hand-delivered bouquet of red roses means more today precisely because it's unhurried, deliberate, and real in a way a message can never be."
      },
      {
        heading: 'Why red, specifically?',
        text: "Red has carried the meaning of deep love and desire across cultures for centuries, long before the flower itself became the symbol. A red rose doesn't need an occasion attached to it — it works for a first date, a tenth anniversary, or simply a Tuesday when you want someone to know they're loved. That versatility is part of why it's outlasted every passing trend in gifting."
      },
      {
        heading: 'Choosing the right bouquet in the UAE',
        text: "If you're ordering flower delivery in Dubai, Abu Dhabi, or anywhere else across the Emirates, freshness matters more than almost anything else — the climate here is unforgiving on cut flowers that have been sitting around. Look for a florist that sources and arranges to order rather than pulling from pre-made stock, and ask whether same-day delivery is available if your occasion is time-sensitive."
      },
      {
        heading: 'Keeping your roses fresh longer',
        text: "Trim the stems at an angle before placing them in water, change the water every two days, and keep the arrangement away from direct sun and air conditioning vents — both dry roses out faster than you'd expect in the UAE heat. Done right, a well-cared-for bouquet can easily stay beautiful for a full week."
      },
      {
        text: "Whatever the occasion, a red rose bouquet remains one of the few gifts that never needs an explanation. That's exactly why it's still the first thing people think of — and likely always will be."
      }
    ]
  },
  {
    id: 2,
    slug: 'meaning-behind-rose-colors',
    title: 'The Meaning Behind Rose Colors: Express Your Sentiments',
    category: 'News',
    date: 'July 28, 2026',
    excerpt:
      'Pink roses speak of gratitude and admiration, while deep red carries passion and pure white marks new beginnings — learn the symbolic language of roses before you order your next bouquet.',
    image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589173/luxeflower/products/o8e5h1wpucz90wkvvcpg.jpg',
    content: [
      {
        text: "Roses have carried meaning by color for centuries, and knowing the difference can turn a lovely bouquet into a genuinely thoughtful one. Here's a practical guide to what each shade actually communicates, so your next order says exactly what you mean."
      },
      {
        heading: 'Red — passion and romantic love',
        text: 'The classic choice for anniversaries, proposals, and "I love you" moments. Deep, saturated red reads as serious and heartfelt rather than casual.'
      },
      {
        heading: 'Pink — gratitude, admiration, and gentleness',
        text: "Lighter pink tones suit a thank-you or a gesture of appreciation, while deeper pinks lean more romantic — a good middle ground when red feels like too strong a statement."
      },
      {
        heading: 'White — purity and new beginnings',
        text: "A long-standing favourite for weddings and engagements, white roses also work beautifully for sympathy arrangements and congratulations on a fresh start — a new home, a new baby, a new chapter."
      },
      {
        heading: 'Yellow — friendship and joy',
        text: "Once considered a symbol of jealousy, yellow roses have shifted meaning entirely and now represent warmth, friendship, and celebration — an easy choice for a birthday or a simple pick-me-up for a friend."
      },
      {
        heading: 'Orange and peach — enthusiasm and appreciation',
        text: "A less traditional but increasingly popular choice, orange and peach tones feel energetic and a little unexpected — well suited to congratulating someone on an achievement."
      },
      {
        text: "If you're not sure which to pick, a mixed arrangement that blends two or three complementary shades is almost always a safe, elegant choice — and lets the recipient feel a bit of everything you're trying to say."
      }
    ]
  },
  {
    id: 3,
    slug: 'white-roses-weddings-new-beginnings',
    title: 'White Roses: Timeless Elegance for Weddings & New Beginnings',
    category: 'News',
    date: 'July 15, 2026',
    excerpt:
      "Nothing captures purity and grace quite like a pristine white rose arrangement. See why they remain the top choice for weddings, engagements, and life's most meaningful milestones.",
    image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589211/luxeflower/products/w7ixnj1t1adicei6hdmn.jpg',
    content: [
      {
        text: "Of all the colors a rose comes in, white is the one that never goes out of style. It photographs beautifully, pairs effortlessly with any color palette, and carries a quiet elegance that louder colors simply can't match — which is exactly why it remains the most requested choice for UAE weddings and engagements year after year."
      },
      {
        heading: 'Why florists and planners keep coming back to white',
        text: "White roses work with every venue, every season, and every other color in a wedding's design — gold accents, blush pinks, deep greenery, it doesn't matter. That flexibility makes them the safest and most reliably beautiful choice for bouquets, centerpieces, and ceremony arches alike."
      },
      {
        heading: 'Beyond weddings',
        text: "White roses aren't only for ceremonies. They're a thoughtful choice for a new home, a new job, a new baby, or simply marking a fresh start — the same symbolism of purity and new beginnings applies just as well outside a wedding context."
      },
      {
        heading: 'Ordering for an event',
        text: "If you're planning around a wedding or large event in the UAE, order your arrangements a few days ahead where possible, and confirm your florist can deliver on the exact date and venue you need — for anything time-critical, same-day delivery options are worth confirming upfront rather than assuming."
      },
      {
        text: "Simple, elegant, and endlessly adaptable — it's easy to see why white roses have stayed at the top of every wedding florist's list, and likely always will."
      }
    ]
  },
  {
    id: 4,
    slug: 'same-day-flower-delivery-uae',
    title: 'Same-Day Flower Delivery Across the UAE: What to Expect',
    category: 'Bloom',
    date: 'September 10, 2026',
    excerpt:
      "Forgot an occasion, or just want flowers to arrive today? Here's what actually determines whether same-day flower delivery works in Dubai, Abu Dhabi, and across the Emirates — and how to make sure it does.",
    image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589186/luxeflower/products/xmhywpzi4neve96g8aki.jpg',
    content: [
      {
        text: "Same-day flower delivery sounds simple, but a few practical details actually decide whether it happens smoothly — especially across a country as spread out as the UAE, where a delivery in Dubai Marina and one in Al Ain are very different logistical journeys."
      },
      {
        heading: 'Order cut-off times matter',
        text: "Most florists that genuinely offer same-day delivery need the order placed by a certain time in the day — often early-to-mid afternoon — to have enough time to hand-arrange the bouquet and get it on the road. If you're ordering late in the evening for same-day, call ahead and confirm rather than assuming."
      },
      {
        heading: "Where you are matters more than you'd think",
        text: "Delivery within a major city like Dubai or Abu Dhabi is usually the most reliable for same-day service. Deliveries to more remote emirates or outlying areas may take an extra day simply due to distance — a reputable florist will tell you this upfront instead of promising something they can't deliver."
      },
      {
        heading: 'Fresh still matters more than fast',
        text: "A rushed, pre-made arrangement delivered same-day isn't actually better than a properly hand-tied bouquet delivered the next morning. The best florists balance both — arranging fresh, to order, while still hitting a same-day window whenever the order timing allows it."
      },
      {
        heading: 'What to have ready when you order',
        text: "A full delivery address with clear landmarks (not just a building name), a working contact number for the recipient, and the exact time window you need — these three things alone prevent almost every delivery delay."
      },
      {
        text: "Same-day flower delivery across the UAE is genuinely reliable when you order from a florist who's upfront about cut-off times and coverage areas — the key is simply asking the right questions before you order, not after."
      }
    ]
  },
  {
    id: 5,
    slug: 'keep-bouquet-fresh-uae-heat',
    title: "Flower Care 101: How to Keep Your Bouquet Fresh Longer in the UAE Heat",
    category: 'Bloom',
    date: 'September 22, 2026',
    excerpt:
      "UAE summers are brutal on cut flowers. A few simple habits can double how long your bouquet stays beautiful — here's exactly what actually works.",
    image: 'https://res.cloudinary.com/etywezeq/image/upload/v1787589198/luxeflower/products/hjkzuvhylxnne23qgaq5.jpg',
    content: [
      {
        text: "Flowers in the UAE face a tougher environment than almost anywhere else — intense heat outdoors and dry, constant air conditioning indoors. Both pull moisture out of petals and stems faster than most people realize. The good news: a handful of simple habits make a real difference in how long a bouquet stays fresh."
      },
      {
        heading: 'Trim the stems properly',
        text: "Cut about 2cm off each stem at a 45-degree angle before placing flowers in water. A fresh, angled cut exposes more surface area for water absorption than a flat cut, and removes any end that's already started to seal over and block water uptake."
      },
      {
        heading: 'Change the water every two days',
        text: "Bacteria builds up in vase water faster in warm climates, and that bacteria is what actually kills flowers early — not the heat itself. Fresh water every couple of days, with stems re-trimmed each time, is the single biggest factor in how long a bouquet lasts."
      },
      {
        heading: 'Keep them away from AC vents and direct sun',
        text: "It's tempting to place a bouquet somewhere bright and visible, but direct sun and the blast of a cold AC vent both dry flowers out unevenly and shorten their life significantly. A spot with indirect light, away from vents, is ideal."
      },
      {
        heading: 'Remove wilting stems as you go',
        text: "A single wilting stem releases ethylene gas that speeds up wilting in the flowers around it. Pulling spent stems out promptly keeps the rest of the arrangement looking fresh for longer."
      },
      {
        heading: 'Use flower food if it was provided',
        text: "The small packet of flower food that comes with a bouquet isn't just a formality — it genuinely feeds the flowers and controls bacteria growth in the water. If you don't have any, a teaspoon of sugar and a few drops of white vinegar in the water does something similar in a pinch."
      },
      {
        text: "None of this takes more than a couple of minutes every other day, and the difference is real — a well cared-for bouquet in the UAE can easily last a full week instead of wilting within two or three days."
      }
    ]
  }
];
