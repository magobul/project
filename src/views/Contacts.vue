<template>
  <div class="contacts">
    <div class="container">
      <h2>Контакты</h2>
      
      <div class="contacts-content">
        <div class="contact-info">
          <h3>Наши контакты</h3>
          
          <div class="contact-item">
            <h4>Адрес:</h4>
            <p>г. Новосибирск, ул. Северный проезд, 15</p>
          </div>
          
          <div class="contact-item">
            <h4>Телефоны:</h4>
            <p>+7 (383) 432-53-21 (основной)</p>
            <p>+7 (913) 852-38-65 (мобильный)</p>
          </div>
          
          <div class="contact-item">
            <h4>Email:</h4>
            <p>info@kvadrat.ru (общие вопросы)</p>
            <p>sales@kvadrat.ru (отдел продаж)</p>
          </div>
          
          <div class="contact-item">
            <h4>Режим работы:</h4>
            <p>Понедельник - Пятница: 9:00 - 18:00</p>
            <p>Суббота: 10:00 - 15:00</p>
            <p>Воскресенье: выходной</p>
          </div>
        </div>
      </div>
      
      <div class="map">
        <h3>Мы на карте</h3>
        <div id="myMap" style="width: 100%; height: 400px;"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Contacts',
  data() {
    return {
      form: {
        name: '',
        phone: '',
        email: '',
        message: ''
      }
    }
  },
  mounted() {
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
    script.type = 'text/javascript';
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(this.initMap);
      }
    };
    document.head.appendChild(script);
  },
  methods: {
    initMap() {
      this.myMap = new window.ymaps.Map('myMap', {
        center: [54.946460, 82.918461],
        zoom: 16
      });
      
      const placemark = new window.ymaps.Placemark([54.946460, 82.918461], {
        hintContent: 'Квадрат',
        balloonContent: 'г. Новосибирск, ул. Северный проезд, 15'
      });
      
      this.myMap.geoObjects.add(placemark);
    },
    sendMessage() {
      alert('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.')
      this.form = {
        name: '',
        phone: '',
        email: '',
        message: ''
      }
    }
  }
}
</script>

<style scoped>
.contacts {
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

.contacts h2 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2rem;
  color: #5E4239;
}

.contacts-content {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 50px;
}

.contact-info {
  background: #ffffff;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 1600px;
  width: 100%;
}

.contact-info h3 {
  color: black;
  margin-bottom: 25px;
}

.contact-item {
  margin-bottom: 25px;
}

.contact-item h4 {
  color: #333;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.contact-item p {
  margin: 5px 0;
  color: #333;
  line-height: 1.6;
}

.map {
  margin-top: 50px;
}

.map h3 {
  color: #5E4239;
  margin-bottom: 20px;
  text-align: center;
}

#myMap {
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .contact-info {
    padding: 20px;
  }
  
  #myMap {
    height: 300px;
  }
}
</style>