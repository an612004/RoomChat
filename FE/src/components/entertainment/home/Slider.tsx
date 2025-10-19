import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function MovieSlider() {
  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      loop={true}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      navigation
      pagination={{ clickable: true }}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: 400 }}
    >
      <SwiperSlide>
        {/* <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
         <img src="https://image.tmdb.org/t/p/original/iUu7fxwLV600QFsVz5G1Icp23Ub.jpg" alt="Phim 1" className="w-full h-full object-contain" />
        </div> */}
      </SwiperSlide>
      <SwiperSlide>
        {/* <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
         <img src="https://image.tmdb.org/t/p/original/iUu7fxwLV600QFsVz5G1Icp23Ub.jpg" alt="Phim 2" className="w-full h-full object-contain" />
        </div> */}
      </SwiperSlide>
      <SwiperSlide>
        {/* <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
         <img src="https://image.tmdb.org/t/p/original/iUu7fxwLV600QFsVz5G1Icp23Ub.jpg" alt="Phim 3" className="w-full h-full object-contain" />
        </div> */}
      </SwiperSlide>
    </Swiper>
  );
}
