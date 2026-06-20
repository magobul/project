<template>
  <div class="about">
    <div class="container">
      <h2>О компании</h2>
      <div class="about-content">
        <div class="about-text">
          <h3>ООО "Квадрат"</h3>
          <p><strong>Первая компания в Сибири по ремонту и обработке поддонов</strong></p>
          
          <p>Мы специализируемся на всех видах работ с поддонами более 10 лет. Наша компания 
          была основана с целью предоставления качественных услуг по ремонту, обработке 
          и восстановлению поддонов для предприятий Сибирского региона.</p>
          <h4>Ключевые услуги:</h4>
          <ul class="services-list">
            <li><strong>1. ОБРАБОТКА И СОРТИРОВКА</strong>
              <ul>
                <li>Приёмка партий любой сложности и объёма.</li>
                <li>Экспресс-сортировка на месте: исправные, под ремонт, брак.</li>
                <li>Очистка от загрязнений (пыль, грязь, остатки продукции).</li>
              </ul>
            </li>
            <li><strong>2. РЕМОНТ И ВОССТАНОВЛЕНИЕ (ПЕРЕБОРКА)</strong>
              <ul>
                <li>Глубокий ремонт: Замена настилов, брусков, усиление углов.</li>
                <li>Экспресс-ремонт: Устранение мелких повреждений, забивка торчащих гвоздей.</li>
                <li>Восстановление «из брака»: Разборка непригодных паллет и сборка из годных компонентов новых.</li>
                <li>Используем профессиональный пневмоинструмент и станки.</li>
              </ul>
            </li>
            <li><strong>3. САНИТАРНАЯ ОБРАБОТКА И СЕРТИФИКАЦИЯ</strong>
              <ul>
                <li>Термообработка (НТ) для экспортных паллет со стандартом ISPM 15.</li>
                <li>Нанесение маркировки IPPC.</li>
                <li>Промышленная мойка паллет.</li>
              </ul>
            </li>
            <li><strong>4. ЛОГИСТИКА И ОБРАЩЕНИЕ</strong>
              <ul>
                <li>Загрузка/выгрузка паллет на вашем складе или на нашей площадке.</li>
                <li>Доставка исправных паллет «под заказ» к вашей производственной линии.</li>
                <li>Вывоз битых и грязных поддонов.</li>
                <li>Ответственное хранение и учёт вашего паллетного фонда.</li>
              </ul>
            </li>
            <li><strong>5. КОНСАЛТИНГ И ПУЛИНГ</strong>
              <ul>
                <li>Анализ оборачиваемости и оптимизация затрат на тару.</li>
                <li>Организация услуг паллет-пулинга (аренды оборотных паллет) через партнёров.</li>
                <li>Утилизация непригодных паллет с выдачей актов.</li>
              </ul>
            </li>
          </ul>
          <h5>Наши преимущества:</h5>
          <ul>
            <li>«Под ключ»: От приёмки грязной тары до выдачи сертифицированных паллет.</li>
            <li>Скорость: Чёткие сроки благодаря отлаженному процессу.</li>
            <li>Экономия: Стоимость восстановления в 2-3 раза ниже покупки новой паллеты.</li>
            <li>Безопасность: Все восстановленные паллеты проходят контроль на прочность и соответствие ГОСТ/евростандартам.</li>
            <li>Прозрачность: Поэтапный отчёт и фотофиксация при необходимости.</li>
            <li>Современное оборудование, опытные специалисты, качественные материалы и гарантия на все виды работ</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 50px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.about h2 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2rem;
  color: #5E4239;
}

.about-content {
  display: flex;
  justify-content: center;
}

.about-text {
  background: #ffffff;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 900px;
  width: 100%;
}

.about-text h3 {
  color: black;
  margin-bottom: 20px;
}

.about-text p {
  margin-bottom: 20px;
  line-height: 1.6;
}

.about-text h4 {
  margin: 25px 0 15px;
  color: #333;
}

.about-text h5 {
  margin: 25px 0 15px;
  color: #333;
  font-size: 1em; 
  font-weight: bold;
}

.about-text ul {
  list-style: none;
  padding-left: 20px;
}

.about-text li {
  margin-bottom: 10px;
  position: relative;
  padding-left: 25px;
}

.about-text li:before {
  content: "●";
  position: absolute;
  left: 0;
  color: #A97B6C;
  font-weight: bold;
}

.services-list > li:before {
  content: none;
}

.about-text li ul {
  margin-top: 5px;
  margin-bottom: 5px;
}

.about-text li li:before {
  content: "●";
  color: #A97B6C;
}

@media (max-width: 768px) {
  .about-text {
    padding: 20px;
  }
}
</style>