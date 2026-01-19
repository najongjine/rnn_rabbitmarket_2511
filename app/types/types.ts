export interface KakaoPlaceType {
  address_name?: string;
  category_group_code?: string;
  category_group_name?: string;
  category_name?: string;
  distance?: number;
  id?: string;
  phone?: string;
  place_name?: string;
  place_url?: string;
  road_address_name?: string;
  x?: number;
  y?: number;
  rating?: number;
  congestion_level?: number;
  predicted_recommendation_score?: number;
}

export interface KakaoAddressResponse {
  meta: {
    total_count: number;
  };
  documents: {
    road_address: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      road_name: string;
      underground_yn: string;
      main_building_no: string;
      sub_building_no: string;
      building_name: string;
      zone_no: string;
    } | null;
    address: {
      address_name: string;
      region_1depth_name: string;
      region_2depth_name: string;
      region_3depth_name: string;
      mountain_yn: string;
      main_address_no: string;
      sub_address_no: string;
    } | null;
  }[];
}

export interface CategoryType {
  id?: number;
  name?: string;
  order_no?: number;
}
/**
 * PostGIS의 ST_AsGeoJSON 결과 구조
 * (Point 타입 기준)
 */
interface GeoJsonPointType {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * json_agg 및 json_build_object로 생성된 이미지 객체 구조
 */
interface ItemImageType {
  img_id: number;
  url: string;
  created_dt: Date | string; // node-postgres 등 드라이버 설정에 따라 Date 객체 또는 문자열
}

/**
 * 메인 쿼리 결과 타입
 */
export interface ItemDetailType {
  item_id?: number;
  user_id?: number;
  category_id?: number;
  // LEFT JOIN이므로 카테고리가 삭제되었거나 없을 경우 null일 수 있음
  category_name?: string | null;
  title?: string;
  content?: string;
  price?: number;
  // 상태값이 정해져 있다면 유니온 타입 권장 (예: 'SALE' | 'SOLD' | 'RESERVED')
  status?: string;
  addr?: string;
  created_at?: Date;
  updated_at?: Date;

  // ::json으로 캐스팅되었으므로 파싱된 객체로 반환됨
  geo_point?: GeoJsonPointType;

  // pgvector의 embedding은 보통 숫자 배열로 반환됨
  embedding?: number[];

  // COALESCE(..., '[]') 처리를 했으므로 null이 아님을 보장
  images?: ItemImageType[];
  user_addr?: string;
  distance_m?: number | null;
}
