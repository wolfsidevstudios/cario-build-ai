
export interface ChatMessage {
  role: 'user' | 'model';
  parts: [{
    text: string;
  }];
}

export interface AppAsset {
  id: string;
  type: 'image' | 'sound';
  url: string;
}
