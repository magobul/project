<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>ООО "Квадрат"</h4>
          <p>Первая компания в Сибири по ремонту и обработке поддонов</p>
        </div>
        
        <div class="footer-section">
          <h4>Контакты</h4>
          <p>г. Новосибирск, ул. Северный проезд, 15</p>
          <p>Телефон: +7 (383) 432-53-21</p>
          <p>Email: info@kvadrat.ru</p>
        </div>
        
        <div class="footer-section">
          <h4>Услуги</h4>
          <ul>
            <li>Обработка поддонов</li>
            <li>Ремонт поддонов</li>
            <li>Переборка поддонов</li>
            <li>Восстановление поддонов</li>
            <li>Загрузка/выгрузка</li>
          </ul>
        </div>
      </div>
      
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background: #5E4239;
  color: #E2D4C2;
  padding: 50px 0 20px;
  
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h4 {
  color: #E2D4C2;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.footer-section p {
  margin-bottom: 10px;
  color: #E2D4C2;
}

.footer-section ul {
  list-style: none;
}

.footer-section li {
  margin-bottom: 8px;
  color: #E2D4C2;
}
</style>