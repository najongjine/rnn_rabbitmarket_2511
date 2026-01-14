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
