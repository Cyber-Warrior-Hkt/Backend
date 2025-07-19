import { DateTime } from "neo4j-driver"


export type Case = {
    case_id: number,
    user_id: number,
    victim_name: string,
    date: DateTime
    sus_social: string,
    suspect_name: string,
    sus_tel: number,
    sus_bank_account_number: number,
    link: string
}

export type Victim = {
  user_id: number;
  name_surname: string;
  victim_tel: number;
  gender: string;
  birth: Date;
  email: string;
  line_id: string;
  Facebook: string;
  job: string;
  work_place: string;
  address_home: string;
  address_district: string;
  address_prefecture: string;
  address_province: string;
};

export type Suspect = {
  suspect_name: string;
  sus_bank_account_number: number;
  sus_tel: number;
  link: string;
};

export type Phone = {
  sus_tel: number;
  isp: string;
  Owner: string;
  suspect_name: string;
};

export type BankAccount = {
  sus_bank_account_number: number;
  bank: string;
  Owner: string;
  suspect_name: string;
};

export type Link = {
  link: string;
  suspect_name: string;
};


export type CaseDataUnionItem =
  | { case: Case }
  | { victim: Victim }
  | { suspect: Suspect }
  | { phone: Phone }
  | { bank_account: BankAccount }
  | { link: Link };


export type CaseDataArray = CaseDataUnionItem[];


