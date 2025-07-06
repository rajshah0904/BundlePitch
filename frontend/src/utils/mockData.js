export const mockGenerateCopy = ({ bundleName, tone, items }) => {
  const toneStyles = {
    warm: {
      titlePrefix: "Cozy",
      pitchStyle: "heartwarming",
      bulletStyle: "nurturing",
      instagramStyle: "💕"
    },
    playful: {
      titlePrefix: "Fun",
      pitchStyle: "exciting",
      bulletStyle: "energetic",
      instagramStyle: "🎉"
    },
    minimal: {
      titlePrefix: "Essential",
      pitchStyle: "clean",
      bulletStyle: "streamlined",
      instagramStyle: "✨"
    },
    luxury: {
      titlePrefix: "Premium",
      pitchStyle: "elegant",
      bulletStyle: "sophisticated",
      instagramStyle: "🌟"
    },
    casual: {
      titlePrefix: "Easy",
      pitchStyle: "relaxed",
      bulletStyle: "laid-back",
      instagramStyle: "😊"
    },
    professional: {
      titlePrefix: "Complete",
      pitchStyle: "reliable",
      bulletStyle: "efficient",
      instagramStyle: "👔"
    }
  };

  const style = toneStyles[tone] || toneStyles.warm;
  const itemCount = items.length;

  // Generate Bundle Title
  const title = `${style.titlePrefix} ${bundleName} - ${itemCount} Piece Bundle Collection`;

  // Generate Pitch Paragraph
  const pitchTemplates = {
    warm: `There's something magical about finding the perfect combination of items that just belong together. This ${bundleName} brings together ${itemCount} carefully chosen pieces that create a complete experience. Each item complements the others, creating a thoughtful collection that's greater than the sum of its parts. Whether you're treating yourself or someone special, this bundle delivers that perfect "just right" feeling.`,
    playful: `Get ready to fall in love with this amazing ${bundleName}! We've packed ${itemCount} fantastic items into one incredible bundle that's going to make your day (and your wallet) so much happier. Why settle for just one great thing when you can have the whole collection? This bundle is like getting the VIP treatment - everything you want, all in one place!`,
    minimal: `${bundleName} simplified. ${itemCount} essential pieces, thoughtfully curated. Clean lines, purposeful design, maximum impact. This isn't just a bundle - it's a complete solution. Every item serves a purpose, every piece has been chosen with intention. Streamlined, elegant, effective.`,
    luxury: `Experience the epitome of elegance with this exquisite ${bundleName}. This carefully curated collection of ${itemCount} premium pieces represents the finest in quality and design. Each item has been selected for its exceptional craftsmanship and enduring appeal. This isn't just a purchase - it's an investment in excellence.`,
    casual: `Life's too short for complicated choices! This ${bundleName} makes everything easy by bringing together ${itemCount} awesome items that just work well together. No stress, no overthinking - just grab this bundle and you're all set. It's the kind of collection that makes you smile every time you use it.`,
    professional: `Introducing the comprehensive ${bundleName} - a meticulously assembled collection of ${itemCount} high-quality items designed for optimal performance. This bundle represents excellent value and practical efficiency, delivering everything you need in one convenient package. Trusted, tested, and ready to exceed your expectations.`
  };

  const pitch = pitchTemplates[tone] || pitchTemplates.warm;

  // Generate Bullet Points
  const bullets = items.map((item, index) => {
    const bulletStyles = {
      warm: `${item.title} - A loving addition that ${item.description || 'brings comfort and joy to your collection'}`,
      playful: `${item.title} - The fun piece that ${item.description || 'adds excitement and energy to your bundle'}`,
      minimal: `${item.title} - Essential element, ${item.description || 'designed for maximum impact'}`,
      luxury: `${item.title} - Premium quality ${item.description || 'crafted with exceptional attention to detail'}`,
      casual: `${item.title} - The easy choice that ${item.description || 'makes everything better'}`,
      professional: `${item.title} - Professional-grade ${item.description || 'designed for reliable performance'}`
    };

    return bulletStyles[tone] || bulletStyles.warm;
  });

  // Generate Instagram Caption
  const instagramTemplates = {
    warm: `New bundle alert! ${style.instagramStyle} This ${bundleName} is giving me all the cozy vibes. Sometimes you just need that perfect combination of items that feel like a warm hug. Link in bio! #handmade #bundle #cozy`,
    playful: `Bundle drop! ${style.instagramStyle} This ${bundleName} is absolutely everything! Who else loves a good bundle deal? Tag someone who needs this in their life! #bundledeal #shopsmall #treatyourself`,
    minimal: `Clean. Simple. Perfect. ${style.instagramStyle} New ${bundleName} now available. Less is more. #minimal #curated #essential`,
    luxury: `Introducing our premium ${bundleName} ${style.instagramStyle} Crafted for those who appreciate the finer things. Available now. #luxury #premium #crafted`,
    casual: `Hey friends! ${style.instagramStyle} Just dropped this super cute ${bundleName} and I'm obsessed! Perfect for anyone who loves good vibes and great deals. #shoplocal #bundleup #goodvibes`,
    professional: `New professional bundle available ${style.instagramStyle} ${bundleName} - designed for excellence, built to last. Link in bio for details. #professional #quality #bundle`
  };

  const instagram = instagramTemplates[tone] || instagramTemplates.warm;

  return {
    title,
    pitch,
    bullets,
    instagram
  };
};