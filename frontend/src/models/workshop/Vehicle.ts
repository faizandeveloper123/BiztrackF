export interface Vehicle {
  id: string;
  tenant_id: string;
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  vin?: string;
  registration_number?: string;
  mileage?: string;
  engine_number?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreate {
  make: string;
  model: string;
  year?: string;
  color?: string;
  vin?: string;
  registration_number: string;
  mileage?: string;
  engine_number?: string;
  notes?: string;
}

export interface VehicleUpdate {
  make?: string;
  model?: string;
  year?: string;
  color?: string;
  vin?: string;
  registration_number?: string;
  mileage?: string;
  engine_number?: string;
  notes?: string;
  is_active?: boolean;
}
