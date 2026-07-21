import sharp from 'sharp';
import fs from 'fs';

async function generateIcons() {
  // 우선순위: 1. 사용자가 직접 업로드한 PNG/JPG -> 2. 기존 SVG
  let sourcePath = './public/golf_couple.svg';
  let isSvg = true;

  if (fs.existsSync('./public/golf_couple.png') && fs.statSync('./public/golf_couple.png').size > 20000) {
    // 용량이 어느 정도 있는 실제 PNG 파일이 존재하는 경우 (벡터에서 단순 생성된 것보다 큰 사용자 업로드 이미지)
    sourcePath = './public/golf_couple.png';
    isSvg = false;
  } else if (fs.existsSync('./public/golf_couple.jpg')) {
    sourcePath = './public/golf_couple.jpg';
    isSvg = false;
  } else if (fs.existsSync('./public/golf_couple.jpeg')) {
    sourcePath = './public/golf_couple.jpeg';
    isSvg = false;
  }

  console.log(`🎨 PWA PNG 아이콘 생성을 시작합니다 (소스: ${sourcePath})...`);

  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
  }

  // 512x512 PNG 생성
  await sharp(sourcePath)
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512.png');
  console.log("✅ 512x512 아이콘이 생성되었습니다.");

  // 만약 소스가 SVG였다면, 웹 화면용 golf_couple.png 도 함께 생성해줍니다.
  if (isSvg) {
    await sharp(sourcePath)
      .resize(512, 512)
      .png()
      .toFile('./public/golf_couple.png');
    console.log("✅ golf_couple.png 이 생성되었습니다.");
  }

  // 192x192 PNG 생성
  await sharp(sourcePath)
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192.png');
  console.log("✅ 192x192 아이콘이 생성되었습니다.");

  // 180x180 PNG 생성 (Apple Touch Icon)
  await sharp(sourcePath)
    .resize(180, 180)
    .png()
    .toFile('./public/apple-touch-icon.png');
  console.log("✅ 180x180 (Apple Touch Icon) 아이콘이 생성되었습니다.");

  console.log("🎉 모든 PWA PNG 아이콘 생성이 완료되었습니다!");
}

generateIcons().catch(err => {
  console.error("❌ 아이콘 생성 에러:", err);
});
