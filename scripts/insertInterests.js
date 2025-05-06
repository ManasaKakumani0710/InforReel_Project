// const Interest = require('../models/interestCategory'); 

// const insertStaticInterests = async () => {
//   try {
//     const existing = await Interest.countDocuments();

//     if (existing > 0) {
//       console.log('Interests already exist, skipping insert.');
//       return;
//     }

//     const interests = [
//         {
//           category: "Social Engagement & Content Creation",
//           options: [
//             "Vlogging & Storytelling",
//             "Product Reviews & Hauls",
//             "Live Shopping",
//             "Brand Collabs"
//           ]
//         },
//         {
//           category: "Business & Growth Interests",
//           options: [
//             "Becoming a Seller",
//             "Becoming a Brand Ambassador",
//             "Growing as an Influencer",
//             "Partnering with Brands",
//             "Launching a Collection",
//             "Earning from Social Commerce"
//           ]
//         },
//         {
//           category: "Entertainment Interests",
//           options: [
//             "Music (Afrobeats, Hip–Hop, Pop, EDM, etc.)",
//             "Comedy & Skits",
//             "Dance & Choreography",
//             "Short Films & Series",
//             "Celebrity Lifestyle",
//             "Behind-the-Scenes Content"
//           ]
//         },
//         {
//           category: "Lifestyle & Shopping Interests",
//           options: [
//             "Fashion (Men's / Women’s / Streetwear / Luxury)",
//             "Beauty & Skincare",
//             "Health & Wellness",
//             "Fitness & Workout Gear",
//             "Sportswear & Athleisure",
//             "Tech & Gadgets",
//             "Home & Living",
//             "Accessories & Jewelry"
//           ]
//         }
//       ];
    
//     await Interest.insertMany(interests);
//     console.log('Interests inserted successfully!');
//   } catch (err) {
//     console.error('Error inserting interests:', err);
//   }
// };

// module.exports = insertStaticInterests;
