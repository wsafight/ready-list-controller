type LinearListQueryList<T> = () => Promise<T[]>;

type UniqueKey = string | number;

type GetRequiredQueryFun = ({
  unReadyKeys,
}: {
  unReadyKeys: UniqueKey[];
}) => Promise<void>;

type GetUid<T> = (item: T) => UniqueKey;

class ReadyListController<T> {
  linearListReadyStatus: boolean[] = [];

  linearListQueryList: LinearListQueryList<T>[] = [];

  readyUidSet: Set<UniqueKey> = new Set<UniqueKey>();

  getUid: GetUid<T>;

  getRequiredQueryFun: GetRequiredQueryFun;

  constructor({
    getUid,
    getRequiredQueryFun,
  }: {
    getUid: GetUid<T>;
    getRequiredQueryFun: GetRequiredQueryFun;
  }) {
    this.getUid = getUid;
    this.getRequiredQueryFun = getRequiredQueryFun;
  }

  initialOrReset = ({
    linearListQueryList,
  }: {
    linearListQueryList: LinearListQueryList<T>[];
  }) => {
    this.initialQueryList(linearListQueryList);
    this.readyUidSet = new Set();
  };

  get isLoadDone(): boolean {
    return this.linearListReadyStatus.every(item => item);
  }

  loadLinearList = (index: number): Promise<T[]> => {
    if (typeof index !== 'number') {
      return Promise.reject(new Error('index must be a number'));
    }

    if (Number.isNaN(index)) {
      return Promise.reject(new Error('index must not be NaN'));
    }

    if (index < 0 || index >= this.linearListQueryList.length) {
      return Promise.reject(new Error('index must be within range'));
    }

    if (this.linearListReadyStatus[index]) {
      return Promise.resolve([]);
    }

    return this.linearListQueryList[index]().then(res => {
      this.linearListReadyStatus[index] = true;
      const fixedRes = Array.isArray(res) ? res : [res];
      if (fixedRes.length) {
        fixedRes.forEach(item => {
          const uid = this.getUid(item);
          this.readyUidSet.add(uid);
        });
      }

      return res;
    });
  };

  getUnReadyUids = ({ uidList }: { uidList: UniqueKey[] }): UniqueKey[] => {
    if (!uidList) {
      return [];
    }

    const unReadyKeys: UniqueKey[] = [];
    uidList.forEach(uid => {
      if (!this.readyUidSet.has(uid)) {
        unReadyKeys.push(uid);
      }
    });
    return unReadyKeys;
  };

  loadRequireInfoForItems = ({
    uidList,
  }: {
    uidList: string[];
  }): Promise<void> => {
    if (this.isLoadDone) {
      return Promise.resolve();
    }

    const unReadyKeys = this.getUnReadyUids({ uidList });

    if (!unReadyKeys.length) {
      return Promise.resolve();
    }

    return this.getRequiredQueryFun({
      unReadyKeys,
    }).then(() => {
      unReadyKeys.forEach(item => {
        this.readyUidSet.add(item);
      });
    });
  };

  private initialQueryList = (
    linearListQueryList: LinearListQueryList<T>[],
  ) => {
    this.linearListQueryList = linearListQueryList;
    const queryCount = linearListQueryList.length;
    this.linearListReadyStatus = new Array(queryCount);
    this.linearListReadyStatus.fill(false);
  };
}

export { ReadyListController };

export default ReadyListController;
