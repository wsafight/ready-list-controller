type LinearListCanShowQuery<T> = () => Promise<T[]>;

type UniqueKey = string | number;

type GetRequiredQueryFun = ({
  unReadyKeys,
}: {
  unReadyKeys: UniqueKey[];
}) => Promise<void>;

type GetUid<T> = (item: T) => UniqueKey;

class ReadyListController<T> {
  linearListCanShowQueryIndex: number = -1;

  linearListCanShowQueryList: LinearListCanShowQuery<T>[] = [];

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
    linearListCanShowQueryList,
  }: {
    linearListCanShowQueryList: LinearListCanShowQuery<T>[];
  }) => {
    this.linearListCanShowQueryList = linearListCanShowQueryList;
    this.linearListCanShowQueryIndex = 0;
    this.readyUidSet = new Set();
  };

  get isLoadDone(): boolean {
    return (
      this.linearListCanShowQueryIndex ===
      this.linearListCanShowQueryList.length
    );
  }

  loadLinearList() {
    if (this.isLoadDone) {
      return Promise.resolve();
    }

    return this.linearListCanShowQueryList[
      this.linearListCanShowQueryIndex++
    ]().then(res => {
      const fixedRes = Array.isArray(res) ? res : [res];
      if (fixedRes.length) {
        fixedRes.forEach(item => {
          const uid = this.getUid(item);
          this.readyUidSet.add(uid);
        });
      }
      return res;
    });
  }

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
}

export { ReadyListController };

export default ReadyListController;
